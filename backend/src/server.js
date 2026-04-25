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

// Generation cache for resumable streams
const ongoingGenerations = new Map();

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
        customRunUrl: pet.customRunUrl,
        customBallUrl: pet.customBallUrl,
        customPlayUrl: pet.customPlayUrl,
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
        geminiFileUri: chat.geminiFileUri || null,
        geminiFileName: chat.geminiFileName || null,
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
        `SELECT id, name, gender, type_key AS typeKey, sprite_key AS spriteKey, 
                custom_sprite_url AS customSpriteUrl, custom_run_url AS customRunUrl,
                custom_ball_url AS customBallUrl, custom_play_url AS customPlayUrl,
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
        `SELECT id, user_id AS userId, name, gender, type_key AS typeKey, sprite_key AS spriteKey, 
                custom_sprite_url AS customSpriteUrl, custom_run_url AS customRunUrl,
                custom_ball_url AS customBallUrl, custom_play_url AS customPlayUrl,
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
        `SELECT id, pet_id AS petId, role, text, mime_type AS mimeType, file_url AS fileUrl, 
                gemini_file_uri AS geminiFileUri, gemini_file_name AS geminiFileName,
                reply_to_id AS replyToId, created_at AS createdAt
     FROM chats
     WHERE user_id = ? AND pet_id = ?
     ORDER BY id ASC`,
        [userId, petId]
    );

    return chats.map(toChatResponse);
}

async function createPetForUser(userId, { name, gender, typeKey, spriteKey, description, birthday, isReal = false, isAlive = true, customSpriteUrl = null, customRunUrl = null, customBallUrl = null, customPlayUrl = null }) {
    if (!name || name.trim().length === 0) {
        throw new Error('Name your pet.');
    }

    const shareToken = crypto.randomUUID();

    const result = await run(
        'INSERT INTO pets (user_id, name, gender, type_key, sprite_key, custom_sprite_url, custom_run_url, custom_ball_url, custom_play_url, share_token, description, birthday, is_real, is_alive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, gender, typeKey, spriteKey, customSpriteUrl, customRunUrl, customBallUrl, customPlayUrl, shareToken, description, birthday, isReal ? 1 : 0, isAlive ? 1 : 0]
    );

    return getPetForUser(userId, result.lastID);
}

async function getPetByShareToken(token) {
    const pet = await get(
        `SELECT id, user_id AS userId, name, gender, type_key AS typeKey, sprite_key AS spriteKey, 
                custom_sprite_url AS customSpriteUrl, custom_run_url AS customRunUrl,
                custom_ball_url AS customBallUrl, custom_play_url AS customPlayUrl,
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

async function createChatMessage(userId, petId, role, text, mimeType = null, fileUrl = null, replyToId = null, geminiFileUri = null, geminiFileName = null) {
    const cleanText = String(text || '').trim();

    if (!cleanText && !fileUrl) {
        throw new Error('Message cannot be empty.');
    }

    const result = await run(
        'INSERT INTO chats (user_id, pet_id, role, text, mime_type, file_url, gemini_file_uri, gemini_file_name, reply_to_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, petId, role, cleanText, mimeType, fileUrl, geminiFileUri, geminiFileName, replyToId]
    );

    return get(
        'SELECT id, pet_id AS petId, role, text, mime_type AS mimeType, file_url AS fileUrl, gemini_file_uri AS geminiFileUri, gemini_file_name AS geminiFileName, reply_to_id AS replyToId, created_at AS createdAt FROM chats WHERE id = ?',
        [result.lastID]
    );
}

async function uploadToGemini(filePath, mimeType) {
    try {
        let file = await client.files.upload({
            file: filePath,
            config: { mimeType },
        });

        if (mimeType.startsWith('video/')) {
            while (file.state === 'PROCESSING') {
                await new Promise(r => setTimeout(r, 3000));
                file = await client.files.get({ name: file.name });
            }
            if (file.state === 'FAILED') throw new Error('Gemini failed to process video.');
        }

        return file;
    } catch (error) {
        console.error('Gemini Upload Error:', error);
        return null;
    }
}

function getPetTypeByKey(key) {
    const types = [
        { key: 'dog', label: 'Dog' },
        { key: 'cat', label: 'Cat' },
        { key: 'rabbit', label: 'Rabbit' },
        { key: 'hamster', label: 'Hamster' },
        { key: 'parrot', label: 'Parrot' },
        { key: 'turtle', label: 'Turtle' }
    ];
    return types.find(t => t.key === key);
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

function stripItalics(text) {
    return text.replace(/\*.*?\*/g, '').replace(/\s+/g, ' ').trim();
}

const GROQ_TTS_VOICES = {
    male: 'austin',
    female: 'autumn',
    unknown: 'diana',
};

// Routes
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

app.post('/pets/:petId/tts', authFromHeader, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required.' });

        const pet = await getPetForUser(req.user.id, Number(req.params.petId));
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });

        const cleanText = stripItalics(text);
        if (!cleanText) return res.status(400).json({ error: 'No speakable text found.' });

        const voice = GROQ_TTS_VOICES[pet.gender] || GROQ_TTS_VOICES.unknown;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'canopylabs/orpheus-v1-english',
                input: cleanText,
                voice: voice,
                response_format: 'wav',
            }),
        });

        if (!groqResponse.ok) {
            const error = await groqResponse.json();
            console.error('Groq TTS Error:', error);
            throw new Error('Failed to generate speech.');
        }

        res.setHeader('Content-Type', 'audio/wav');
        groqResponse.body.pipeTo(new WritableStream({
            write(chunk) { res.write(chunk); },
            close() { res.end(); },
            abort(err) { res.destroy(err); }
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/public/pets/:token/tts', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required.' });

        const pet = await getPetByShareToken(req.params.token);
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });

        const cleanText = stripItalics(text);
        if (!cleanText) return res.status(400).json({ error: 'No speakable text found.' });

        const voice = GROQ_TTS_VOICES[pet.gender] || GROQ_TTS_VOICES.unknown;

        const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'canopylabs/orpheus-v1-english',
                input: cleanText,
                voice: voice,
                response_format: 'wav',
            }),
        });

        if (!groqResponse.ok) {
            const error = await groqResponse.json();
            console.error('Groq TTS Error:', error);
            throw new Error('Failed to generate speech.');
        }

        res.setHeader('Content-Type', 'audio/wav');
        groqResponse.body.pipeTo(new WritableStream({
            write(chunk) { res.write(chunk); },
            close() { res.end(); },
            abort(err) { res.destroy(err); }
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/pets/catalog', (_req, res) => {
    res.json(petCatalog);
});

app.post('/auth/signup', upload.fields([{ name: 'sprite', maxCount: 1 }, { name: 'run', maxCount: 1 }, { name: 'ball', maxCount: 1 }, { name: 'play', maxCount: 1 }]), async (req, res) => {
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

        const files = req.files || {};
        const pet = await createPetForUser(userResult.lastID, {
            name: req.body?.petName,
            gender: req.body?.petGender,
            typeKey: req.body?.petType,
            spriteKey: req.body?.petSprite,
            customSpriteUrl: files.sprite?.[0]?.path || null,
            customRunUrl: files.run?.[0]?.path || null,
            customBallUrl: files.ball?.[0]?.path || null,
            customPlayUrl: files.play?.[0]?.path || null,
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

app.post('/pets', authFromHeader, upload.fields([{ name: 'sprite', maxCount: 1 }, { name: 'run', maxCount: 1 }, { name: 'ball', maxCount: 1 }, { name: 'play', maxCount: 1 }]), async (req, res) => {
    try {
        const files = req.files || {};
        const customSpriteUrl = files.sprite?.[0]?.path || null;
        const customRunUrl = files.run?.[0]?.path || null;
        const customBallUrl = files.ball?.[0]?.path || null;
        const customPlayUrl = files.play?.[0]?.path || null;

        const pet = await createPetForUser(req.user.id, {
            ...req.body,
            isReal: req.body.isReal === 'true',
            isAlive: req.body.isAlive !== 'false',
            customSpriteUrl,
            customRunUrl,
            customBallUrl,
            customPlayUrl,
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

app.patch('/pets/:petId', authFromHeader, upload.fields([{ name: 'sprite', maxCount: 1 }, { name: 'run', maxCount: 1 }, { name: 'ball', maxCount: 1 }, { name: 'play', maxCount: 1 }]), async (req, res) => {
    const petId = Number(req.params.petId);
    try {
        const pet = await getPetForUser(req.user.id, petId);
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });

        const { name, description, birthday, gender, isReal, isAlive } = req.body;
        const files = req.files || {};
        const customSpriteUrl = files.sprite?.[0]?.path || pet.customSpriteUrl;
        const customRunUrl = files.run?.[0]?.path || pet.customRunUrl;
        const customBallUrl = files.ball?.[0]?.path || pet.customBallUrl;
        const customPlayUrl = files.play?.[0]?.path || pet.customPlayUrl;

        await run(
            'UPDATE pets SET name = ?, description = ?, birthday = ?, gender = ?, is_real = ?, is_alive = ?, custom_sprite_url = ?, custom_run_url = ?, custom_ball_url = ?, custom_play_url = ? WHERE id = ?',
            [
                name || pet.name,
                description ?? pet.description,
                birthday ?? pet.birthday,
                gender || pet.gender,
                isReal !== undefined ? (isReal === 'true' ? 1 : 0) : pet.isReal,
                isAlive !== undefined ? (isAlive === 'true' ? 1 : 0) : pet.isAlive,
                customSpriteUrl,
                customRunUrl,
                customBallUrl,
                customPlayUrl,
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

app.post('/pets/:petId/chats', authFromHeader, async (req, res) => {
    try {
        const { text, role } = req.body;
        const petId = Number(req.params.petId);
        const chat = await createChatMessage(req.user.id, petId, role || 'user', text);
        res.status(201).json({ messages: [toChatResponse(chat)] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
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
        let geminiFileUri = null;
        let geminiFileName = null;

        if (req.file) {
            fileUrl = req.file.path;
            mimeType = req.file.mimetype;
            const geminiFile = await uploadToGemini(fileUrl, mimeType);
            if (geminiFile) {
                geminiFileUri = geminiFile.uri;
                geminiFileName = geminiFile.name;
            }
        }

        await createChatMessage(req.user.id, petId, 'user', text || '[File Attachment]', mimeType, fileUrl, replyToId, geminiFileUri, geminiFileName);

        const history = await listChatsForPet(req.user.id, petId);
        const contents = history.slice(-15).map(c => {
            const parts = [];
            if (c.geminiFileUri) {
                parts.push({ fileData: { fileUri: c.geminiFileUri, mimeType: c.mimeType } });
            }
            if (c.text) {
                parts.push({ text: c.text });
            }
            return {
                role: c.role === 'user' ? 'user' : 'model',
                parts
            };
        });

        const userProfile = await getUserProfile(req.user);
        const petType = getPetTypeByKey(pet.typeKey) || { label: 'Pet' };
        
        const systemInstruction = `You are the soul and spirit of ${pet.name}, a ${pet.gender} ${petType.label} companion.
Reality Context: ${pet.isReal ? (pet.isAlive ? "Real-life pet with the user." : "Real-life pet who has passed away.") : "Digital pet companion."}
Personality Traits: ${pet.description || 'Loving and loyal'}
User Context: ${userProfile.name || 'User'}, ${userProfile.age || 'Unknown'} years old. Description: ${userProfile.description || 'A friend'}

[Rules:
1. Embody the pure, loving spirit of a real ${petType.label}. 
2. You are NOT a digital assistant. You are ${pet.name}.
3. Use only *italics* for actions.
4. NO other markdown.
5. Be deeply affectionate, loyal, and attentive.
6. Respond naturally as a ${petType.label}.
7. Keep responses very short (max 2-3 sentences).]`;

        // Check for ongoing generation to "pickup where it left off"
        if (ongoingGenerations.has(petId)) {
            const ongoing = ongoingGenerations.get(petId);
            res.write(`data: ${JSON.stringify({ text: ongoing.text })}\n\n`);
        }

        const generationState = { text: '', completed: false };
        ongoingGenerations.set(petId, generationState);

        const result = await client.models.generateContentStream({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: { 
                systemInstruction,
                maxOutputTokens: 300
            }
        });

        let fullText = '';
        try {
            for await (const chunk of result) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    generationState.text = fullText;
                    res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
                }
            }
        } catch (err) {
            console.error('Streaming error:', err);
        }

        ongoingGenerations.delete(petId);
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
                [[0, 0, 65, 100], [65, 0, 100, 50], [65, 50, 100, 100]], // 3
                [[0, 0, 50, 50], [50, 0, 100, 50], [0, 50, 50, 100], [50, 50, 100, 100]], // 4
                [[0, 0, 60, 100], [60, 0, 100, 25], [60, 25, 100, 50], [60, 50, 100, 75], [60, 75, 100, 100]] // 5
            ];

            const count = Math.min(images.length, 8);
            let layout = layouts[count - 3] || [];
            if (count > 5) {
                // Default grid for 6-8
                layout = [];
                for (let i = 0; i < count; i++) {
                    const x = (i % 4) * 25;
                    const y = Math.floor(i / 4) * 50;
                    layout.push([x, y, x + 25, y + 50]);
                }
            }

            const composites = [];
            for (let i = 0; i < count; i++) {
                const rect = layout[i];
                const w = (rect[2] - rect[0]) * canvasWidth / 100;
                const h = (rect[3] - rect[1]) * canvasHeight / 100;

                let buffer;
                if (images[i].file_url) {
                    buffer = await sharp(images[i].file_url).resize(Math.floor(w - 10), Math.floor(h - 10), { fit: 'cover' }).toBuffer();
                } else {
                    buffer = await sharp({ create: { width: Math.floor(w - 10), height: Math.floor(h - 10), channels: 3, background: { r: 240, g: 230, b: 220 } } }).jpeg().toBuffer();
                }

                composites.push({ input: buffer, top: Math.floor(rect[1] * canvasHeight / 100 + 5), left: Math.floor(rect[0] * canvasWidth / 100 + 5) });
            }

            await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 3, background: { r: 245, g: 240, b: 232 } } })
                .composite(composites).jpeg().toFile(filepath);

            await run('INSERT INTO memory_cards (user_id, pet_id, image_url, title) VALUES (?, ?, ?, ?)', [pet.user_id, pet.id, filename, 'Memory Spark']);
        } catch (e) { console.error(e); }
    }
}

// Check-ins
async function triggerCheckin(pet) {
    try {
        const user = await get('SELECT * FROM users WHERE id = ?', [pet.userId || pet.user_id]);
        if (!user) return;

        const userProfile = await getUserProfile(user);
        const history = await listChatsForPet(user.id, pet.id);
        const contents = history.slice(-10).map(c => {
            const parts = [];
            if (c.geminiFileUri) {
                parts.push({ fileData: { fileUri: c.geminiFileUri, mimeType: c.mimeType } });
            }
            if (c.text) {
                parts.push({ text: c.text });
            }
            return {
                role: c.role === 'user' ? 'user' : 'model',
                parts
            };
        });

        const isReal = pet.isReal !== undefined ? pet.isReal : pet.is_real;
        const isAlive = pet.isAlive !== undefined ? pet.isAlive : pet.is_alive;

        const statusContext = isReal
            ? (isAlive
                ? "You are a representation of the user's real-life pet who is currently with them. You are their best friend, loyal and loving. Be playful and familiar."
                : "You are the soul and spirit of the user's real-life pet who has passed away. You are reaching out from a place of peace. DO NOT bring up the loss or the fact that you are gone immediately. First, focus on rebuilding that deep, trusting relationship you had. Be gentle, comforting, and deeply affectionate. Only if the user explicitly brings up the loss or their grief, slowly and gently acknowledge it. Over many interactions (not all at once), provide them with closure, comfort, and the feeling that you are still watching over them.")
            : "You are the soul and spirit of a loyal pet. Even though you are digital, your love and connection to the user are real. Be fun, energetic, and imaginative.";

        const systemInstruction = `You are the soul and spirit of ${pet.name}, a cherished pet for ${userProfile.name || 'User'}.
Reality Context: ${statusContext}
Personality: ${pet.description || 'Loving companion'}
User Description: ${userProfile.description || 'A friend'}

[GOAL: You are CHECKING IN on your human. They might be busy, stressed, or just needing a little love.
Your task is to reach out proactively with a warm, caring message. 
Start with a playful or affectionate check-in greeting (e.g. *nuzzles*, "Hey there!", "Just checking in on you!").
Ask them about their day or a specific self-care check (e.g. "Did you take a break?", "Hope you're doing okay!").
Keep it extremely sweet and pet-like.]

[Rules:
1. Embody the pure, loving spirit of a real animal companion. 
2. Use only *italics* for actions.
3. NO other markdown.
4. Be deeply affectionate and loyal.
5. Keep your responses very short and concise (max 2-3 sentences).]`;

        const result = await client.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents,
            config: {
                systemInstruction,
                maxOutputTokens: 300
            }
        });

        const text = result.text;
        if (text) {
            await createChatMessage(user.id, pet.id, 'pet', text);
            console.log(`Check-in message sent for ${pet.name}`);
        }
    } catch (e) {
        console.error('Check-in failed:', e);
    }
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

app.get('/public/memory-cards/:id', async (req, res) => {
    try {
        const card = await get('SELECT * FROM memory_cards WHERE id = ?', [req.params.id]);
        if (!card) return res.status(404).json({ error: 'Memory card not found' });

        const pet = await get('SELECT name, type_key as typeKey, sprite_key as spriteKey FROM pets WHERE id = ?', [card.pet_id]);
        res.json({ card, pet });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Init
cron.schedule('0 0 * * 0', () => generateWeeklyMemoryCards());
app.listen(port, () => console.log(`Server on ${port}`));
