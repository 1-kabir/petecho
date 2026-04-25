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

// Routes
app.get('/health', (_req, res) => {
    res.json({ ok: true });
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
            error: error instanceof Error ? error.message : 'Unable to create account.',
        });
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
        res.status(500).json({ error: 'Unable to log in.' });
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
        res.status(500).json({ error: 'Unable to update profile.' });
    }
});

app.get('/pets', authFromHeader, async (req, res) => {
    res.json({
        pets: await listPetsForUser(req.user.id),
    });
});

app.post('/pets', authFromHeader, upload.single('sprite'), async (req, res) => {
    try {
        const customSpriteUrl = req.file ? req.file.path : null;
        const pet = await createPetForUser(req.user.id, {
            ...req.body,
            isReal: req.body.isReal === 'true',
            isAlive: req.body.isAlive !== 'false',
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
        res.status(400).json({ error: error.message });
    }
});

app.patch('/pets/:petId', authFromHeader, upload.single('sprite'), async (req, res) => {
    const petId = Number(req.params.petId);
    try {
        const pet = await getPetForUser(req.user.id, petId);
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });

        const { name, description, birthday, gender, isReal, isAlive } = req.body;
        const customSpriteUrl = req.file ? req.file.path : pet.customSpriteUrl;

        await run(
            'UPDATE pets SET name = ?, description = ?, birthday = ?, gender = ?, is_real = ?, is_alive = ?, custom_sprite_url = ? WHERE id = ?',
            [
                name || pet.name,
                description ?? pet.description,
                birthday ?? pet.birthday,
                gender || pet.gender,
                isReal !== undefined ? (isReal === 'true' ? 1 : 0) : pet.isReal,
                isAlive !== undefined ? (isAlive === 'true' ? 1 : 0) : pet.isAlive,
                customSpriteUrl,
                petId
            ]
        );

        const updated = await getPetForUser(req.user.id, petId);
        res.json({ pet: toPetResponse(updated) });
    } catch (error) {
        res.status(500).json({ error: 'Update failed.' });
    }
});

app.delete('/pets/:petId', authFromHeader, async (req, res) => {
    try {
        await run('DELETE FROM pets WHERE id = ? AND user_id = ?', [req.params.petId, req.user.id]);
        res.json({ message: 'Pet deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed.' });
    }
});

app.patch('/pets/:petId/stats', authFromHeader, async (req, res) => {
    const { action } = req.body;
    const column = `${action}_count`;
    await run(`UPDATE pets SET ${column} = ${column} + 1 WHERE id = ? AND user_id = ?`, [req.params.petId, req.user.id]);
    const pet = await getPetForUser(req.user.id, req.params.petId);
    res.json({ pet: toPetResponse(pet) });
});

app.get('/pets/:petId/chats', authFromHeader, async (req, res) => {
    const chats = await listChatsForPet(req.user.id, req.params.petId);
    const pet = await getPetForUser(req.user.id, req.params.petId);
    res.json({ pet: toPetResponse(pet), chats });
});

app.post('/pets/:petId/chats/stream', authFromHeader, upload.single('file'), async (req, res) => {
    const petId = Number(req.params.petId);
    const text = String(req.body?.text || '').trim();
    const replyToId = req.body?.replyToId;

    const pet = await getPetForUser(req.user.id, petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        let fileUrl = null;
        let mimeType = null;
        if (req.file) {
            fileUrl = req.file.path;
            mimeType = req.file.mimetype;
        }

        await createChatMessage(req.user.id, petId, 'user', text || '[File Attachment]', mimeType, fileUrl, replyToId);

        const history = await listChatsForPet(req.user.id, petId);
        const contents = history.slice(-15).map(c => ({
            role: c.role === 'user' ? 'user' : 'model',
            parts: [{ text: c.text }],
        }));

        const userProfile = await getUserProfile(req.user);
        const statusContext = pet.isReal
            ? (pet.isAlive
                ? "You are a representation of the user's real-life pet who is currently with them."
                : "You are a memorial representation of the user's real-life pet who has passed away. DO NOT bring up the loss immediately. Build trust first. Only if they bring it up, slowly provide closure.")
            : "You are a purely digital companion pet.";

        const systemInstruction = `You are the soul and spirit of a cherished pet for a user named ${userProfile.name || 'User'}.
Reality Context: ${statusContext}
Personality: ${pet.description || 'Loving companion'}
[Rules: Use only *italics* for actions. No other markdown. Be deeply affectionate.]`;

        const result = await client.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: { systemInstruction }
        });

        let fullText = '';
        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunkText) {
                fullText += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        await createChatMessage(req.user.id, petId, 'pet', fullText);
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error(error);
        res.write(`data: ${JSON.stringify({ error: 'I am a bit lost...' })}\n\n`);
        res.end();
    }
});

// Memory Cards
app.get('/pets/:petId/memory-cards', authFromHeader, async (req, res) => {
    const cards = await all('SELECT * FROM memory_cards WHERE pet_id = ? ORDER BY id DESC', [req.params.petId]);
    res.json({ cards });
});

app.post('/dev/trigger-memory-card', async (req, res) => {
    const { petId, force } = req.body;
    await generateWeeklyMemoryCards(petId, !!force);
    res.send('Triggered');
});

async function generateWeeklyMemoryCards(specificPetId = null, force = false) {
    const pets = specificPetId ? await all('SELECT * FROM pets WHERE id = ?', [specificPetId]) : await all('SELECT * FROM pets');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const pet of pets) {
        let images = await all(
            `SELECT file_url FROM chats WHERE pet_id = ? AND mime_type LIKE 'image/%' AND created_at > ? ORDER BY created_at DESC LIMIT 8`,
            [pet.id, oneWeekAgo]
        );

        if (force && images.length < 3) {
            while (images.length < 3) images.push({ isPlaceholder: true });
        }

        if (images.length < 3 && !force) continue;

        try {
            const filename = `memory_${pet.id}_${Date.now()}.jpg`;
            const filepath = path.join('data/files', filename);
            const canvasWidth = 1200;
            const canvasHeight = 800;
            
            const layouts = [
                [[0, 0, 65, 100], [65, 0, 35, 50], [65, 50, 35, 100]], // 3
                [[0, 0, 50, 50], [50, 0, 50, 50], [0, 50, 50, 100], [50, 50, 50, 100]], // 4
                [[0, 0, 60, 100], [60, 0, 40, 25], [60, 25, 40, 50], [60, 50, 40, 75], [60, 75, 40, 100]] // 5
            ];
            
            const count = Math.min(images.length, 8);
            let layout = layouts[count - 3] || [];
            if (count > 5) {
                // Default grid for 6-8
                layout = [];
                for(let i=0; i<count; i++) {
                    const x = (i % 4) * 25;
                    const y = Math.floor(i / 4) * 50;
                    layout.push([x, y, x+25, y+50]);
                }
            }

            const composites = [];
            for (let i = 0; i < count; i++) {
                const rect = layout[i];
                const w = (rect[2] - rect[0]) * canvasWidth / 100;
                const h = (rect[3] - rect[1]) * canvasHeight / 100;
                
                let buffer;
                if (images[i].file_url) {
                    buffer = await sharp(images[i].file_url).resize(Math.floor(w-10), Math.floor(h-10), {fit:'cover'}).toBuffer();
                } else {
                    buffer = await sharp({create:{width:Math.floor(w-10), height:Math.floor(h-10), channels:3, background:{r:240, g:230, b:220}}}).jpeg().toBuffer();
                }
                
                composites.push({ input: buffer, top: Math.floor(rect[1]*canvasHeight/100 + 5), left: Math.floor(rect[0]*canvasWidth/100 + 5) });
            }

            await sharp({create:{width:canvasWidth, height:canvasHeight, channels:3, background:{r:245,g:240,b:232}}})
                .composite(composites).jpeg().toFile(filepath);

            await run('INSERT INTO memory_cards (user_id, pet_id, image_url, title) VALUES (?, ?, ?, ?)', [pet.user_id, pet.id, filename, 'Memory Spark']);
        } catch (e) { console.error(e); }
    }
}

// Check-ins
async function triggerCheckin(pet) {
    const user = await get('SELECT * FROM users WHERE id = ?', [pet.user_id]);
    const history = await listChatsForPet(user.id, pet.id);
    const contents = history.slice(-10).map(c => ({ role: c.role === 'user' ? 'user' : 'model', parts: [{ text: c.text }] }));
    
    const result = await client.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents,
        config: { systemInstruction: `You are ${pet.name}. Checking in with user. Ask about their day. Be sweet.` }
    });
    
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) await createChatMessage(user.id, pet.id, 'pet', text);
}

app.post('/dev/trigger-checkin', async (req, res) => {
    const pet = await get('SELECT * FROM pets WHERE id = ?', [req.body.petId]);
    await triggerCheckin(pet);
    res.send('OK');
});

// Public Share
app.get('/public/pets/:token', async (req, res) => {
    const pet = await getPetByShareToken(req.params.token);
    res.json({ pet });
});

app.patch('/public/pets/:token/stats', async (req, res) => {
    const pet = await incrementGuestStat(req.params.token, req.body.action);
    res.json({ pet });
});

// Init
cron.schedule('0 0 * * 0', () => generateWeeklyMemoryCards());
app.listen(port, () => console.log(`Server on ${port}`));
