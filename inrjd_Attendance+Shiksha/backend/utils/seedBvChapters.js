require("dotenv").config();
const mongoose = require("mongoose");
const Config = require("../models/Config");

// ✏️  Replace these with your actual BV chapter names
const BV_CHAPTERS = [
  "CHAPTER 1 - Difference between human and animal life",
  "CHAPTER 2 - Source of knowledge",
  "CHAPTER 3 - Who am I?",
  "CHAPTER 4 - Why am I suffering?",
  "CHAPTER 5 - What is this material world",
  "CHAPTER 6 - Who is God?",
  "CHAPTER 7 - Lord Caitanya and sankirtan",
  "CHAPTER 8 - Glories of the holy name",
  "CHAPTER 9 - Reincarnation",
  "CHAPTER 10 - Sinful and pious activities - karma",
  "CHAPTER 11 - Karma free activities",
  "CHAPTER 12 - Offering to the Lord",
  "CHAPTER 13 - Ante Narayana smriti",
  "CHAPTER 14 - Eternity of bhakti",
  "CHAPTER 15 - Bhakti yoga",
  "CHAPTER 16 - Vyuha 2 - Karma",
  "CHAPTER 17 - Rules and regulations",
  "CHAPTER 18 - Importance of prayers",
  "CHAPTER 19 - Service to Tulasi",
  "CHAPTER 20 - Importance of decorating the body with tilaka",
  "CHAPTER 21 - Vyuha 3 - Panchatattva",
  "CHAPTER 22 - Kali's four legs",
  "CHAPTER 23 - Reasons for sin and places of lust",
  "CHAPTER 24 - False ego",
  "CHAPTER 25 - Mind, intelligence and soul",
  "CHAPTER 26 - Nature of the mind",
  "CHAPTER 27 - Do we need to control the mind?",
  "CHAPTER 28 - Yoga",
  "CHAPTER 29 - Vyuha 4 - Yoga ladder",
  "CHAPTER 30 - Topmost yoga",
  "CHAPTER 31 - Who begins?",
  "CHAPTER 32 - Ferris wheel",
  "CHAPTER 33 - Demigods",
  "CHAPTER 34 - Three modes of material nature",
  "CHAPTER 35 - Sublime way to cross the three modes",
  "CHAPTER 36 - Vyuha 5 - Seminar on the three modes of material nature",
  "CHAPTER 37 - Need for a guru",
  "CHAPTER 38 - Genuine guru",
  "CHAPTER 39 - Srila Prabhupada",
  "CHAPTER 40 - Disciplic succession",
  "CHAPTER 41 - Most fortunate soul",
  "CHAPTER 42 - How to approach a guru?",
  "CHAPTER 43 - Diksha",
  "CHAPTER 44 - Handout on performing arati",
  "CHAPTER 45 - Five angas of bhakti and importance of holy dham",
  "CHAPTER 46 - Sadhu Sanga (continuation of five angas of bhakti)",
  "CHAPTER 47 - Discussion of sastras (continuation of five angas of bhakti)",
  "CHAPTER 48 - Deity Worship (continuation of five angas of bhakti)",
  "CHAPTER 49 - Chanting of the Holy names (continuation of five angas of bhakti)",
  "CHAPTER 50 - Nama Aparadha (Chanting with offences)",
  "CHAPTER 51 - Protection of bhakti lata",
  "CHAPTER 52 - Vyuha 7 - Japa Workshop",
  "CHAPTER 53 - Vaisnava aparadha– part 1",
  "CHAPTER 54 - Vaisnava aparadha– part 2",
  "CHAPTER 55 - Dealings amongst devotees",
  "CHAPTER 56 - Vyuha 8– Vaisnava etiquette",
  "CHAPTER 57 - Varna",
  "CHAPTER 58 - Asrama",
  "CHAPTER 59 - Vyuha 9– Seminar on Grhasta / Brahmacari ashrama",
  "CHAPTER 60 - Personal and impersonal feature of God",
  "CHAPTER 61 - Wiseman’s story",
  "CHAPTER 62 - Sadhana Bhakti",
  "CHAPTER 63 - Most confidential knowledge",
  "CHAPTER 64 - Surrender unto Me",
  "CHAPTER 65 - Vyuha 10 - Hare Krsna world and GBC",
  "CHAPTER 66 - Accepting things favourable for devotional service (part 1)",
  "CHAPTER 67 - Accepting things favourable for devotional service (part 2)",
  "CHAPTER 68 - Rejecting things unfavourable for devotional service (part 1)",
  "CHAPTER 69 - Rejecting things unfavourable for devotional service (part 2)",
  "CHAPTER 70 - Vyuha 11– ISKCON Disciple course",
  "CHAPTER 71 - Vyuha 12 - Graduation– Glories of preaching",
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await Config.findOne({ type: "bvChapters" });

    if (!existing) {
      await Config.create({ type: "bvChapters", values: BV_CHAPTERS });
      console.log(`✨ Created bvChapters with ${BV_CHAPTERS.length} entries:`);
    } else {
      const toAdd = BV_CHAPTERS.filter((c) => !existing.values.includes(c));
      if (toAdd.length === 0) {
        console.log("⏭️  All chapters already exist. Nothing to add.");
      } else {
        existing.values.push(...toAdd);
        await existing.save();
        console.log(`📝 Added ${toAdd.length} new chapter(s):`);
        toAdd.forEach((c) => console.log(`   + ${c}`));
      }
    }

    const final = await Config.findOne({ type: "bvChapters" });
    console.log(`\n📋 Total BV Chapters now: ${final.values.length}`);
    final.values.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));

    console.log("\n🎉 Done!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  }
}

seed();
