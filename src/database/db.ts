// import { INoteData } from "@/shared/types";
import sqlite3 from "sqlite3";
const db = new sqlite3.Database('db.sql');

// const create_notes_table = () => {
//     db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, note TEXT)");
// }

// export const set_note = (data: INoteData, callback: Function) => {
//     db.serialize(() => {
//         create_notes_table()

//         const stmt = db.prepare("INSERT OR REPLACE INTO notes (id,note) VALUES ((SELECT id FROM notes WHERE id = ?),?)");
//         stmt.run(data.id, data.note);
//         stmt.finalize();
//         get_all_notes(callback)
//     })
// }

// export const get_all_notes = (callback: Function) => {
//     db.serialize(() => {
//         create_notes_table()
//         db.all("SELECT * FROM notes ORDER BY id DESC", (err, data) => {
//             if (err) return null;
//             callback(data)
//         })
//     })
// }

// export const get_note = (note_id: string, callback: Function) => {
//     db.serialize(() => {
//         create_notes_table()
//         db.get("SELECT * FROM notes WHERE id="+note_id, (err, data) => {
//             if (err) return null
//             callback(data)
//         })
//     })
// }

// export const delete_note = (note_id: string, callback: Function) => {
//     db.serialize(() => {
//         create_notes_table()

//         const stmt = db.prepare("DELETE FROM notes WHERE id=?");
//         stmt.run(note_id);
//         stmt.finalize();
//         get_all_notes(callback)
//     })
// }

// // db.close();

export const initializeDatabase = () => {
    db.serialize(() => {
        // Items
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sku TEXT,
                category TEXT,
                quantity INTEGER NOT NULL DEFAULT 0,
                price REAL NOT NULL,
                gst REAL NOT NULL DEFAULT 0,
                barcode TEXT,
                updated_at INTEGER NOT NULL
            )
        `);

        // Customers
        db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                updated_at INTEGER NOT NULL
            )
        `);

        // Bills
        db.run(`
            CREATE TABLE IF NOT EXISTS bills (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                items_json TEXT NOT NULL,
                subtotal REAL NOT NULL,
                gst_total REAL NOT NULL,
                total REAL NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0
            )
        `);

        // Auth cache
        db.run(`
            CREATE TABLE IF NOT EXISTS auth_cache (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                encrypted_token TEXT,
                updated_at INTEGER NOT NULL
            )
        `);

        // Trial info
        db.run(`
            CREATE TABLE IF NOT EXISTS trial_info (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                encrypted_payload TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
        `);

        // Store info
        db.run(`
            CREATE TABLE IF NOT EXISTS store_info (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT,
                gst_number TEXT,
                address TEXT,
                phone TEXT,
                updated_at INTEGER NOT NULL
            )
        `);
    });
};