/**
 * Entry point serverless untuk Vercel.
 *
 * Vercel memperlakukan setiap file di folder api/ sebagai satu function.
 * vercel.json me-rewrite SEMUA path ke sini, jadi routing tetap dipegang
 * Express, bukan dipecah jadi banyak function.
 *
 * Tidak ada listen() di sini — hanya mengekspor app.
 */
import { createApp } from "../src/app.js";

export default createApp();
