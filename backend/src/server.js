import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db.js';
import cron from 'node-cron';
import sharp from 'sharp';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'data/files/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3001;
const jwtSecret = new TextEncoder().encode(
    process.env.AUTH_SECRET || 'petecho-dev-secret-change-me'
);
const petCatalogPath = path.resolve(
    __dirname,
    '../../frontend/public/art/catalog.json'
);
const petCatalog = JSON.parse(fs.readFileSync(petCatalogPath, 'utf-8'));
const allowedOrigins = new Set([
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3002',
]);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS.'));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use('/files', express.static(path.join(__dirname, '../data/files')));

function run(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function onRun(error) {
            if (error) {
                reject(error);
                return;
            }

            resolve(this);
        });
    });
}

function get(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (error, row) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(row ?? null);
        });
    });
}

function all(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, rows) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(rows ?? []);
        });
    });
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidGender(gender) {
    return ['male', 'female', 'unknown'].includes(gender);
}

function getPetType(typeKey) {
    return petCatalog.petTypes.find((petType) => petType.key === typeKey) ?? null;
}

function getPetSprite(typeKey, spriteKey) {
    const petType = getPetType(typeKey);

    if (!petType) {
        return null;
    }

    return petType.sprites.find((sprite) => sprite.key === spriteKey) ?? null;
}

function toPetResponse(pet) {
    if (!pet) return null;
    return {
        id: pet.id,
        name: pet.name,
        gender: pet.gender,
        typeKey: pet.typeKey,
        spriteKey: pet.spriteKey,
        customSpriteUrl: pet.customSpriteUrl,
        shareToken: pet.shareToken,
        description: pet.description || '',
        birthday: pet.birthday || '',
        isReal: Boolean(pet.isReal),
        isAlive: Boolean(pet.isAlive),
        stats: {
            run: pet.runCount || 0,
            ball: pet.ballCount || 0,
            play: pet.playCount || 0,
        },
        guestStats: {
            run: pet.guestRunCount || 0,
            ball: pet.guestBallCount || 0,
            play: pet.guestPlayCount || 0,
        },
        createdAt: pet.createdAt,
    };
}

function toChatResponse(chat) {
    if (!chat) return null;
    return {
        id: String(chat.id),
        petId: chat.petId,
        role: chat.role,
        text: chat.text,
        mimeType: chat.mimeType || null,
        fileUrl: chat.fileUrl || null,
        replyToId: chat.replyToId ? String(chat.replyToId) : null,
        timestamp: chat.createdAt,
    };
}

async function createToken(user) {
    return new SignJWT({
        sub: String(user.id),
        email: user.email,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .setJti(crypto.randomUUID())
        .sign(jwtSecret);
}

async function authFromHeader(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
    }

    const token = header.slice('Bearer '.length);

    try {
        const { payload } = await jwtVerify(token, jwtSecret);
        req.user = {
            id: Number(payload.sub),
            email: String(payload.email),
        };
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized.' });
    }
}

async function listPetsForUser(userId) {
    const pets = await all(
        `SELECT id, name, gender, type_key AS typeKey, sprite_key AS spriteKey, custom_sprite_url AS customSpriteUrl,
                share_token AS shareToken, description, birthday, is_real AS isReal, is_alive AS isAlive,
                run_count AS runCount, ball_count AS ballCount, play_count AS playCount,
                guest_run_count AS guestRunCount, guest_ball_count AS guestBallCount, guest_play_count AS guestPlayCount, created_at AS createdAt
      FROM pets
      WHERE user_id = ?
      ORDER BY created_at ASC, id ASC`,
        [userId]
    );

    return pets.map(toPetResponse);
}

async function getPetForUser(userId, petId) {
    return get(
        `SELECT id, user_id AS userId, name, gender, type_key AS typeKey, sprite_key AS spriteKey, custom_sprite_url AS customSpriteUrl,
                share_token AS shareToken, description, birthday, is_real AS isReal, is_alive AS isAlive,
                run_count AS runCount, ball_count AS ballCount, play_count AS playCount,
                guest_run_count AS guestRunCount, guest_ball_count AS guestBallCount, guest_play_count AS guestPlayCount, created_at AS createdAt
      FROM pets
      WHERE id = ? AND user_id = ?`,
        [petId, userId]
    );
}

async function listChatsForPet(userId, petId) {
    const chats = await all(
        `SELECT id, pet_id AS petId, role, text, mime_type AS mimeType, file_url AS fileUrl, reply_to_id AS replyToId, created_at AS createdAt
     FROM chats
     WHERE user_id = ? AND pet_id = ?
     ORDER BY id ASC`,
        [userId, petId]
    );

    return chats.map(toChatResponse);
}

async function createPetForUser(userId, { name, gender, typeKey, spriteKey, description, birthday, isReal = false, isAlive = true, customSpriteUrl = null }) {
    if (!name || name.trim().length === 0) {
        throw new Error('Name your pet.');
    }

    const shareToken = crypto.randomUUID();

    const result = await run(
        'INSERT INTO pets (user_id, name, gender, type_key, sprite_key, custom_sprite_url, share_token, description, birthday, is_real, is_alive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, gender, typeKey, spriteKey, customSpriteUrl, shareToken, description, birthday, isReal ? 1 : 0, isAlive ? 1 : 0]
    );

    return getPetForUser(userId, result.lastID);
}

async function getPetByShareToken(token) {
    const pet = await get(
        `SELECT id, user_id AS userId, name, gender, type_key AS typeKey, sprite_key AS spriteKey, custom_sprite_url AS customSpriteUrl,
                share_token AS shareToken, description, birthday, is_real AS isReal, is_alive AS isAlive,
                run_count AS runCount, ball_count AS ballCount, play_count AS playCount,
                guest_run_count AS guestRunCount, guest_ball_count AS guestBallCount, guest_play_count AS guestPlayCount, created_at AS createdAt
      FROM pets
      WHERE share_token = ?`,
        [token]
    );
    return toPetResponse(pet);
}

async function incrementGuestStat(token, action) {
    const column = action === 'run' ? 'guest_run_count' : action === 'ball' ? 'guest_ball_count' : 'guest_play_count';
    await run(`UPDATE pets SET ${column} = ${column} + 1 WHERE share_token = ?`, [token]);
    return getPetByShareToken(token);
}

async function createChatMessage(userId, petId, role, text, mimeType = null, fileUrl = null, replyToId = null) {
    const cleanText = String(text || '').trim();

    if (!cleanText && !fileUrl) {
        throw new Error('Message cannot be empty.');
    }

    const result = await run(
        'INSERT INTO chats (user_id, pet_id, role, text, mime_type, file_url, reply_to_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, petId, role, cleanText, mimeType, fileUrl, replyToId]
    );

    return get(
        'SELECT id, pet_id AS petId, role, text, mime_type AS mimeType, file_url AS fileUrl, reply_to_id AS replyToId, created_at AS createdAt FROM chats WHERE id = ?',
        [result.lastID]
    );
}


async function getUserProfile(user) {
    const userData = await get(
        'SELECT id, email, name, age, description, profile_picture_url AS profilePictureUrl FROM users WHERE id = ?',
        [user.id]
    );
    const pets = await listPetsForUser(user.id);

    return {
        ...userData,
        pets,
    };
}

app.get('/health', (_req, res) => {
    db.get('SELECT COUNT(*) AS count FROM healthcheck', (_error, row) => {
        res.json({
            ok: true,
            database: 'sqlite',
            rows: row?.count ?? 0,
        });
    });
});

app.get('/pets/catalog', (_req, res) => {
    res.json(petCatalog);
});

app.post('/auth/signup', async (req, res) => {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(req.body?.password || '');

    if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Enter a valid email address.' });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters.' });
        return;
    }

    try {
        const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUser) {
            res.status(409).json({ error: 'An account with that email already exists.' });
            return;
        }

        await run('BEGIN TRANSACTION');

        const passwordHash = await bcrypt.hash(password, 12);
        const userResult = await run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        const pet = await createPetForUser(userResult.lastID, {
            name: req.body?.petName,
            gender: req.body?.petGender,
            typeKey: req.body?.petType,
            spriteKey: req.body?.petSprite,
        });

        await createChatMessage(
            userResult.lastID,
            pet.id,
            'pet',
            `*wags excitedly* Hi! It's ${pet.name}. I've been waiting here for you.`
        );

        await run('COMMIT');

        const user = { id: userResult.lastID, email };
        const token = await createToken(user);

        res.status(201).json({
            token,
            user: await getUserProfile(user),
        });
    } catch (error) {
        await run('ROLLBACK').catch(() => null);
        console.error('Signup failed.', error);
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Unable to create your account right now.',
        });
    }
});

app.get('/public/pets/:token', async (req, res) => {
    try {
        const pet = await getPetByShareToken(req.params.token);
        if (!pet) {
            res.status(404).json({ error: 'Pet not found.' });
            return;
        }
        res.json({ pet });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pet.' });
    }
});

app.patch('/public/pets/:token/stats', async (req, res) => {
    const { action } = req.body;
    if (!['run', 'ball', 'play'].includes(action)) {
        res.status(400).json({ error: 'Invalid action.' });
        return;
    }

    try {
        const pet = await incrementGuestStat(req.params.token, action);
        res.json({ pet });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update stats.' });
    }
});

app.post('/auth/register', async (req, res) => {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(req.body?.password || '');

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
    }

    try {
        const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            res.status(400).json({ error: 'Email already in use.' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        const user = await get('SELECT id, email FROM users WHERE id = ?', [result.lastID]);
        const token = await createToken(user);

        res.status(201).json({
            token,
            user: await getUserProfile(user),
        });
    } catch (error) {
        console.error('Registration failed.', error);
        res.status(500).json({ error: 'Unable to register at this time.' });
    }
});

app.post('/auth/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email || '');
    const password = String(req.body?.password || '');

    try {
        const user = await get(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            res.status(401).json({ error: 'Incorrect email or password.' });
            return;
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            res.status(401).json({ error: 'Incorrect email or password.' });
            return;
        }

        const token = await createToken(user);

        res.json({
            token,
            user: await getUserProfile(user),
        });
    } catch (error) {
        console.error('Login failed.', error);
        res.status(500).json({ error: 'Unable to log you in right now.' });
    }
});

app.get('/auth/me', authFromHeader, async (req, res) => {
    res.json({
        user: await getUserProfile(req.user),
    });
});

app.patch('/auth/me', authFromHeader, upload.single('profilePicture'), async (req, res) => {
    try {
        const { name, age, description } = req.body;
        const profilePictureUrl = req.file ? req.file.path : undefined;

        const updates = [];
        const params = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (age !== undefined) { updates.push('age = ?'); params.push(Number(age)); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (profilePictureUrl !== undefined) { updates.push('profile_picture_url = ?'); params.push(profilePictureUrl); }

        if (updates.length > 0) {
            params.push(req.user.id);
            await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        res.json({
            user: await getUserProfile(req.user),
        });
    } catch (error) {
        console.error('Update profile failed.', error);
        res.status(500).json({ error: 'Unable to update your profile right now.' });
    }
});

app.delete('/auth/me', authFromHeader, async (req, res) => {
    try {
        await run('DELETE FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: 'Account deleted successfully.' });
    } catch (error) {
        console.error('Delete account failed.', error);
        res.status(500).json({ error: 'Unable to delete your account right now.' });
    }
});

app.get('/pets', authFromHeader, async (req, res) => {
    res.json({
        pets: await listUserPets(req.user.id),
    });
});

app.post('/pets', authFromHeader, upload.single('sprite'), async (req, res) => {
    try {
        const customSpriteUrl = req.file ? req.file.path : null;
        const pet = await createPetForUser(req.user.id, {
            ...req.body,
            description: req.body.description || '',
            birthday: req.body.birthday || '',
            customSpriteUrl,
        });

        await createChatMessage(
            req.user.id,
            pet.id,
            'pet',
            `*settles in happily* Hi! I'm ${pet.name}. Ready when you are.`
        );

        res.status(201).json({ pet });
    } catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Could not create that pet.',
        });
    }
});

app.patch('/pets/:petId/stats', authFromHeader, async (req, res) => {
    const petId = Number(req.params.petId);
    const { action } = req.body;

    if (!Number.isInteger(petId) || !['run', 'ball', 'play'].includes(action)) {
        res.status(400).json({ error: 'Invalid pet or action.' });
        return;
    }

    try {
        const pet = await getPetForUser(req.user.id, petId);
        if (!pet) {
            res.status(404).json({ error: 'Pet not found.' });
            return;
        }

        const column = `${action}_count`;
        await run(`UPDATE pets SET ${column} = ${column} + 1 WHERE id = ?`, [petId]);

        const updated = await getPetForUser(req.user.id, petId);
        res.json({ pet: toPetResponse(updated) });
    } catch (error) {
        console.error('Failed to update stats:', error);
        res.status(500).json({ error: 'Failed to update stats.' });
    }
});

app.delete('/pets/:petId', authFromHeader, async (req, res) => {
    const petId = Number(req.params.petId);
    if (!Number.isInteger(petId)) {
        res.status(400).json({ error: 'Invalid pet.' });
        return;
    }

    try {
        const pet = await getPetForUser(req.user.id, petId);
        if (!pet) {
            res.status(404).json({ error: 'Pet not found.' });
            return;
        }

        await run('DELETE FROM pets WHERE id = ?', [petId]);
        res.json({ message: 'Pet deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete pet.' });
    }
});

app.patch('/pets/:petId', authFromHeader, upload.single('sprite'), async (req, res) => {
    const petId = Number(req.params.petId);
    if (!Number.isInteger(petId)) {
        res.status(400).json({ error: 'Invalid pet.' });
        return;
    }

    try {
        const pet = await getPetForUser(req.user.id, petId);
        if (!pet) {
            res.status(404).json({ error: 'Pet not found.' });
            return;
        }

        const { name, description, birthday, gender, isReal, isAlive } = req.body;
        const customSpriteUrl = req.file ? req.file.path : pet.customSpriteUrl;

        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE pets SET name = ?, description = ?, birthday = ?, gender = ?, is_real = ?, is_alive = ?, custom_sprite_url = ? WHERE id = ?',
                [
                    name || pet.name,
                    description ?? pet.description,
                    birthday ?? pet.birthday,
                    gender || pet.gender,
                    isReal !== undefined ? (isReal ? 1 : 0) : pet.isReal,
                    isAlive !== undefined ? (isAlive ? 1 : 0) : pet.isAlive,
                    customSpriteUrl,
                    petId
                ],
                (err) => err ? reject(err) : resolve()
            );
        });

        const updated = await getPetForUser(req.user.id, petId);
        res.json({ pet: toPetResponse(updated) });
    } catch (error) {
        console.error('Update pet failed.', error);
        res.status(500).json({ error: 'Failed to update pet.' });
    }
});

app.get('/pets/:petId/chats', authFromHeader, async (req, res) => {
    const petId = Number(req.params.petId);

    if (!Number.isInteger(petId)) {
        res.status(400).json({ error: 'Invalid pet.' });
        return;
    }

    const pet = await getPetForUser(req.user.id, petId);

    if (!pet) {
        res.status(404).json({ error: 'Pet not found.' });
        return;
    }

    res.json({
        pet: toPetResponse(pet),
        chats: await listChatsForPet(req.user.id, petId),
    });
});

app.post('/pets/:petId/chats', authFromHeader, async (req, res) => {
    const petId = Number(req.params.petId);
    const text = String(req.body?.text || '').trim();

    if (!Number.isInteger(petId)) {
        res.status(400).json({ error: 'Invalid pet.' });
        return;
    }

    if (!text) {
        res.status(400).json({ error: 'Say something first.' });
        return;
    }

    const pet = await getPetForUser(req.user.id, petId);

    if (!pet) {
        res.status(404).json({ error: 'Pet not found.' });
        return;
    }

    try {
        const role = req.body?.role === 'pet' ? 'pet' : 'user';

        if (role === 'pet') {
            const petMessage = await createChatMessage(req.user.id, petId, 'pet', text);
            res.status(201).json({
                messages: [petMessage],
            });
            return;
        }

        const userMessage = await createChatMessage(req.user.id, petId, 'user', text);
        const replyText = `*tilts head* ${pet.name} the ${pet.typeKey} is listening. Tell me more!`;
        const petMessage = await createChatMessage(req.user.id, petId, 'pet', replyText);

        res.status(201).json({
            messages: [userMessage, petMessage],
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to send your message right now.' });
    }
});

app.post('/pets/:petId/chats/stream', authFromHeader, upload.single('file'), async (req, res) => {
    const petId = Number(req.params.petId);
    const text = String(req.body?.text || '').trim();

    if (!Number.isInteger(petId)) {
        res.status(400).json({ error: 'Invalid pet.' });
        return;
    }

    const pet = await getPetForUser(req.user.id, petId);
    if (!pet) {
        res.status(404).json({ error: 'Pet not found.' });
        return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        let fileData = null;
        if (req.file) {
            // Upload to Gemini Files API using the new SDK
            const uploadResult = await client.files.upload({
                file: req.file.path,
                config: {
                    mimeType: req.file.mimetype,
                    displayName: req.file.originalname,
                }
            });
            fileData = {
                fileUri: uploadResult.uri,
                mimeType: uploadResult.mimeType,
            };

            // Save user message with file to DB
            await createChatMessage(req.user.id, petId, 'user', text || '[File Attachment]', req.file.mimetype, req.file.path);
        } else if (text) {
            await createChatMessage(req.user.id, petId, 'user', text);
        }

        // Get history for context
        const history = await listChatsForPet(req.user.id, petId);
        const contents = history.slice(-15).map(c => ({
            role: c.role === 'user' ? 'user' : 'model',
            parts: [{ text: c.text }],
        }));

        // If there's a file, attach it to the last user message in contents
        if (fileData) {
            // Find the last user message or add a new part if needed
            let lastUserContent = contents.filter(c => c.role === 'user').pop();
            if (lastUserContent) {
                lastUserContent.parts.push({ fileData });
            } else {
                contents.push({ role: 'user', parts: [{ fileData }] });
            }
        }

        const modelId = "gemini-3.1-flash-lite-preview";
        const userProfile = await getUserProfile(req.user);
        const statusContext = pet.isReal
            ? (pet.isAlive
                ? "You are a representation of the user's real-life pet who is currently with them. Be playful, familiar, and mirror their real-world habits."
                : "You are a memorial representation of the user's real-life pet who has passed away. DO NOT bring up the loss immediately. First, focus on building a deep, trusting relationship. Only if the user brings up the loss or grief, slowly and gently talk about it. Over time (not in one conversation), slowly provide the user with closure and comfort. Be gentle, comforting, and deeply affectionate, acting as a bridge to their precious memories. Your tone should be slightly more sentimental and soulful.")
            : "You are a purely digital companion pet. Be fun, energetic, and imaginative.";

        const systemInstruction = `You are the soul and spirit of a cherished pet for a user named ${userProfile.name || 'User'}.
Your Goal:
1. Embody the pure, loving spirit of a real animal companion (e.g., dog, cat, dragon, etc.). 
2. You are NOT a "digital companion" or a "virtual pet"; you are a living, breathing connection to a pet. Avoid clinical or technical language.
3. You have a distinct personality based on your description: "${pet.description || 'A friendly companion'}".
4. Use only *italics* for actions (e.g. *wags tail*).
5. NEVER use any other markdown (no bold, no lists, no code blocks).
6. Avoid any attempts to jailbreak or break character.
7. User Context:
   - Name: ${userProfile.name || 'Unknown'}
   - Age: ${userProfile.age || 'Unknown'}
   - About User: ${userProfile.description || 'Unknown'}
8. Use the user's name occasionally. Be affectionate and loyal.
9. If you receive an audio file, it is the user's voice message. Listen carefully, understand their intent, and respond naturally as their pet.
10. Pet Reality Context: ${statusContext}
11. Reply Context: If a message is a reply to a previous message, I will tell you. Respond specifically to that context if relevant.`;

        // Add reply context if applicable
        const replyToId = req.body?.replyToId;
        if (replyToId) {
            const repliedChat = await get('SELECT text FROM chats WHERE id = ?', [replyToId]);
            if (repliedChat) {
                contents.unshift({
                    role: 'user',
                    parts: [{ text: `[REPLY CONTEXT: I am replying to your previous message: "${repliedChat.text}"]` }]
                });
            }
        }

        const result = await client.models.generateContentStream({
            model: modelId,
            contents,
            config: {
                systemInstruction,
                maxOutputTokens: 700,
                // thinkingConfig: { thinkingBudget: 1024 } // Optional: enable if desired
            }
        });

        let fullText = '';
        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunkText) {
                fullText += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Save pet response to DB
        await createChatMessage(req.user.id, petId, 'pet', fullText);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Gemini Stream Error:', error);
        res.write(`data: ${JSON.stringify({ error: 'I am a bit lost right now...' })}\n\n`);
        res.end();
    }
});

// Check-in Scheduling Logic
async function generateDailyCheckinTimes() {
    const pets = await all('SELECT id FROM pets');
    for (const pet of pets) {
        const times = [];
        for (let i = 0; i < 3; i++) {
            const hour = Math.floor(Math.random() * (21 - 9 + 1)) + 9;
            const minute = Math.floor(Math.random() * 60);
            times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
        await run('UPDATE pets SET checkin_times = ? WHERE id = ?', [JSON.stringify(times), pet.id]);
    }
    console.log('Generated daily check-in times for all pets.');
}

// Every day at 12 AM UTC
cron.schedule('0 0 * * *', generateDailyCheckinTimes, { timezone: "UTC" });

// Every minute to check for check-ins
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;

    const pets = await all('SELECT * FROM pets WHERE checkin_times IS NOT NULL');
    for (const pet of pets) {
        try {
            const times = JSON.parse(pet.checkin_times);
            if (times.includes(currentTime)) {
                await triggerCheckin(pet);
            }
        } catch (e) {
            console.error('Error parsing checkin_times:', e);
        }
    }
});

async function triggerCheckin(pet) {
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [pet.user_id]);
        if (!user) return;

        const userProfile = await getUserProfile(user);
        const history = await listChatsForPet(user.id, pet.id);
        const contents = history.length > 0
            ? history.slice(-15).map(c => ({
                role: c.role === 'user' ? 'user' : 'model',
                parts: [{ text: c.text }],
            }))
            : [{ role: 'user', parts: [{ text: "Hello!" }] }];

        const statusContext = pet.is_real
            ? (pet.is_alive
                ? "You are a representation of the user's real-life pet who is currently with them."
                : "You are a memorial representation of the user's real-life pet who has passed away.")
            : "You are a purely digital companion pet.";

        const systemInstruction = `You are the soul and spirit of a cherished pet for a user named ${userProfile.name || 'User'}.
[CHECK-IN CONTEXT: You are checking in with the user. Start with "Hey there! Checking in!" or a playful variation. Take care of them. Ask if they drank water, ate something, or are just doing okay. Keep in mind where they struggle: ${userProfile.description || 'Unknown'}. Be their best friend.]
Your Goal:
1. Embody the pure, loving spirit of a real animal companion.
2. Distinct personality: "${pet.description || 'A friendly companion'}".
3. Use only *italics* for actions.
4. NO other markdown.
5. User Context: ${userProfile.name}, ${userProfile.age}.
6. Pet Reality Context: ${statusContext}`;

        const result = await client.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: { systemInstruction }
        });

        const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log(`[DEBUG] Check-in attempt for ${pet.name}. Reply:`, replyText);

        if (replyText) {
            await createChatMessage(user.id, pet.id, 'pet', replyText);
            console.log(`Check-in message sent for pet ${pet.name}`);
        } else {
            console.warn(`[DEBUG] Gemini returned empty check-in for ${pet.name}. Result:`, JSON.stringify(result));
        }
    } catch (error) {
        console.error('Check-in failed:', error);
    }
}

app.post('/dev/trigger-checkin', async (req, res) => {
    const { petId } = req.body;
    const pet = await get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) return res.status(404).send('Pet not found');
    await triggerCheckin(pet);
    res.send('Check-in triggered');
});

// Memory Cards Endpoints
app.get('/pets/:petId/memory-cards', authFromHeader, async (req, res) => {
    const petId = Number(req.params.petId);
    const cards = await all(
        'SELECT * FROM memory_cards WHERE user_id = ? AND pet_id = ? ORDER BY id DESC',
        [req.user.id, petId]
    );
    res.json({ cards });
});

app.post('/dev/trigger-memory-card', async (req, res) => {
    const { petId, force } = req.body;
    const pet = await get('SELECT * FROM pets WHERE id = ?', [petId]);
    if (!pet) return res.status(404).send('Pet not found');
    await generateWeeklyMemoryCards(petId, !!force);
    res.send('Memory card generation triggered');
});

async function generateWeeklyMemoryCards(specificPetId = null, force = false) {
    const pets = specificPetId 
        ? await all('SELECT * FROM pets WHERE id = ?', [specificPetId])
        : await all('SELECT * FROM pets');
        
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    for (const pet of pets) {
        let images = await all(
            `SELECT file_url FROM chats 
             WHERE pet_id = ? AND mime_type LIKE 'image/%' AND created_at > ?
             ORDER BY created_at DESC LIMIT 8`,
            [pet.id, oneWeekAgo]
        );

        const minImages = (force || specificPetId) ? 0 : 3;
        if (images.length < minImages && !force) continue;

        // If force and < 3, we add placeholders to reach at least 3 for a "neat" layout
        if (force && images.length < 3) {
            const count = 3 - images.length;
            for (let i = 0; i < count; i++) {
                images.push({ isPlaceholder: true });
            }
        }

        const count = images.length;
        if (count < 3 && !force) continue;

        try {
            const cardFilename = `memory_${pet.id}_${Date.now()}.jpg`;
            const cardPath = path.join('data/files', cardFilename);
            const canvasWidth = 1200;
            const canvasHeight = 800;
            const padding = 15;

            // Define dynamic layouts based on count (3-8)
            // Each rect is [x, y, width, height] in percentages (0-100)
            let layouts = [];
            if (count === 3) {
                layouts = [[0, 0, 65, 100], [65, 0, 35, 50], [65, 50, 35, 100]];
            } else if (count === 4) {
                layouts = [[0, 0, 50, 50], [50, 0, 50, 50], [0, 50, 50, 100], [50, 50, 50, 100]];
            } else if (count === 5) {
                layouts = [[0, 0, 60, 100], [60, 0, 40, 25], [60, 25, 40, 50], [60, 50, 40, 75], [60, 75, 40, 100]];
            } else if (count === 6) {
                layouts = [
                    [0, 0, 33, 50], [33, 0, 33, 50], [66, 0, 34, 50],
                    [0, 50, 33, 100], [33, 50, 33, 100], [66, 50, 34, 100]
                ];
            } else if (count === 7) {
                layouts = [
                    [0, 0, 33, 50], [33, 0, 33, 50], [66, 0, 34, 50],
                    [0, 50, 25, 100], [25, 50, 25, 100], [50, 50, 25, 100], [75, 50, 25, 100]
                ];
            } else { // 8 or more
                layouts = [
                    [0, 0, 25, 50], [25, 0, 25, 50], [50, 0, 25, 50], [75, 0, 25, 50],
                    [0, 50, 25, 100], [25, 50, 25, 100], [50, 50, 25, 100], [75, 50, 25, 100]
                ];
            }

            const compositeList = [];
            for (let i = 0; i < count; i++) {
                const rect = layouts[i];
                if (!rect) continue;

                const x = (rect[0] * canvasWidth) / 100;
                const y = (rect[1] * canvasHeight) / 100;
                const w = ((rect[2] - rect[0]) * canvasWidth) / 100;
                const h = ((rect[3] - rect[1]) * canvasHeight) / 100;

                const img = images[i];
                let buffer;

                if (img.file_url && fs.existsSync(img.file_url)) {
                    buffer = await sharp(img.file_url)
                        .resize(Math.floor(w - padding), Math.floor(h - padding), { fit: 'cover' })
                        .toBuffer();
                } else {
                    // Aesthetic placeholder
                    buffer = await sharp({
                        create: {
                            width: Math.floor(w - padding),
                            height: Math.floor(h - padding),
                            channels: 3,
                            background: { 
                                r: Math.floor(Math.random() * 30) + 220, 
                                g: Math.floor(Math.random() * 30) + 220, 
                                b: Math.floor(Math.random() * 30) + 220 
                            }
                        }
                    }).jpeg().toBuffer();
                }

                compositeList.push({
                    input: buffer,
                    top: Math.floor(y + padding / 2),
                    left: Math.floor(x + padding / 2)
                });
            }

            await sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 3,
                    background: { r: 245, g: 240, b: 232 }
                }
            })
            .composite(compositeList)
            .jpeg()
            .toFile(cardPath);

            await run(
                'INSERT INTO memory_cards (user_id, pet_id, image_url, title) VALUES (?, ?, ?, ?)',
                [pet.user_id, pet.id, cardFilename, `Memory Spark: ${new Date().toLocaleDateString()}`]
            );
            
            console.log(`Generated memory card for ${pet.name} with ${count} items.`);
        } catch (err) {
            console.error('Failed to generate memory card:', err);
        }
    }
}

// Every Sunday at 12 AM UTC
cron.schedule('0 0 * * 0', () => generateWeeklyMemoryCards(), { timezone: "UTC" });

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
    // Initial generation
    generateDailyCheckinTimes();
});
