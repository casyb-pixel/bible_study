import type { HistoricalText } from "@/lib/historical/types";

/**
 * Seed catalog of writings the Bible references or quotes.
 * Surviving excerpts are historical research material only — never Scripture.
 */
export const HISTORICAL_TEXTS: readonly HistoricalText[] = [
  {
    id: "1-enoch-jude",
    title: "1 Enoch (portion related to Jude)",
    description:
      "Research only. This page holds 1 Enoch chapter 1 (Charles) because Jude 1:14-15 is commonly compared with 1 Enoch 1:9. 1 Enoch as a whole is non-canonical. Scripture alone is authoritative; use this excerpt only for historical comparison with Jude.",
    relatedCanonicalReferences: [
      { label: "Jude 1:14-15", book: "Jude", chapter: 1 },
    ],
    sourceNote:
      "English from the public-domain R. H. Charles translation of 1 Enoch (1917), chapter 1 only. Bracketed editorial marks from some printings are omitted for plain reading.",
    isPlaceholder: false,
    sections: [
      {
        index: 1,
        text: "1 Enoch 1:1. The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed.",
      },
      {
        index: 2,
        text: "1 Enoch 1:2. And he took up his parable and said—Enoch a righteous man, whose eyes were opened by God, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come.",
      },
      {
        index: 3,
        text: "1 Enoch 1:3-4. Concerning the elect I said, and took up my parable concerning them: The Holy Great One will come forth from His dwelling, and the eternal God will tread upon the earth, even on Mount Sinai, and appear in the strength of His might from the heaven of heavens.",
      },
      {
        index: 4,
        text: "1 Enoch 1:5-7. And all shall be smitten with fear, and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth. And the high mountains shall be shaken, and the high hills shall be made low, and shall melt like wax before the flame. And the earth shall be wholly rent in sunder, and all that is upon the earth shall perish, and there shall be a judgement upon all men.",
      },
      {
        index: 5,
        text: "1 Enoch 1:8. But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them. And they shall all belong to God, and they shall be prospered, and they shall all be blessed. And He will help them all, and light shall appear unto them, and He will make peace with them.",
      },
      {
        index: 6,
        text: "1 Enoch 1:9 (lines most often compared with Jude 1:14-15). And behold! He cometh with ten thousands of His holy ones to execute judgement upon all, and to destroy all the ungodly: and to convict all flesh of all the works of their ungodliness which they have ungodly committed, and of all the hard things which ungodly sinners have spoken against Him.",
      },
    ],
  },
  {
    id: "jubilees",
    title: "Book of Jubilees (research note)",
    description:
      "Research only. Jubilees (sometimes called “Little Genesis”) is a Second Temple Jewish work, often dated to the second century B.C., that retells Genesis and early Exodus in a framework of forty-nine-year “jubilees.” It stresses a 364-day solar calendar and expands patriarchal chronology. It is non-canonical. Scripture alone is authoritative.",
    relatedCanonicalReferences: [
      { label: "Genesis 1", book: "Genesis", chapter: 1 },
      { label: "Genesis 2", book: "Genesis", chapter: 2 },
      { label: "Genesis 5", book: "Genesis", chapter: 5 },
      { label: "Genesis 6", book: "Genesis", chapter: 6 },
      { label: "Genesis 7", book: "Genesis", chapter: 7 },
      { label: "Genesis 8", book: "Genesis", chapter: 8 },
      { label: "Genesis 15", book: "Genesis", chapter: 15 },
      { label: "Genesis 17", book: "Genesis", chapter: 17 },
      { label: "Exodus 12", book: "Exodus", chapter: 12 },
      { label: "Exodus 19", book: "Exodus", chapter: 19 },
      { label: "Exodus 20", book: "Exodus", chapter: 20 },
    ],
    sourceNote:
      "Research summary with short public-domain samples after R. H. Charles, The Book of Jubilees. No continuous narrative is presented as Scripture.",
    isPlaceholder: false,
    sections: [
      {
        index: 1,
        text: "What it is. Jubilees retells the storyline of Genesis and early Exodus with added chronological and legal detail. It is an ancient Jewish writing, not part of the Protestant canon.",
      },
      {
        index: 2,
        text: "Main research topics. (1) Creation week and ordered time. (2) A solar year of 364 days urged for festivals. (3) Patriarchal narratives from Adam toward Moses’ day. These notes aid comparison with Genesis and Exodus; they do not replace Scripture.",
      },
      {
        index: 3,
        text: "Illustrative excerpt — creation / time (Charles, Jubilees 2:1): “And the angel of the presence spake to Moses according to the word of the Lord, saying: Write the complete history of the creation, how in six days the Lord God finished all His works and all that He created, and kept Sabbath on the seventh day and hallowed it for all ages…”",
      },
      {
        index: 4,
        text: "Flood and patriarchs (research note). Jubilees expands Flood and patriarchal chronology within its jubilee framework. For the authoritative account, read Genesis 6–8 and the patriarchal chapters in Scripture; treat Jubilees only as a later historical companion.",
      },
      {
        index: 5,
        text: "Illustrative excerpt — calendar (Charles, Jubilees 6:32): “And command thou the children of Israel that they observe the years according to this reckoning—three hundred and sixty-four days, and (these) will constitute a complete year…”",
      },
      {
        index: 6,
        text: "Limits. Only a research summary and short samples are stored so this page cannot be mistaken for a Bible chapter. Full editions belong outside this study path.",
      },
    ],
  },
  {
    id: "jasher",
    title: "Book of Jasher",
    description:
      "Research note (lost work). Joshua 10:13 and 2 Samuel 1:18 refer to “the book of Jasher” when recording events (the sun standing still; the lament over Saul and Jonathan). The writing cited there is lost. Later printed books titled “Book of Jasher” are not that ancient source and are not treated as Scripture here.",
    relatedCanonicalReferences: [
      { label: "Joshua 10:13", book: "Joshua", chapter: 10 },
      { label: "2 Samuel 1:18", book: "2 Samuel", chapter: 1 },
    ],
    sourceNote:
      "Lost work. Canonical mentions only (Joshua 10:13; 2 Samuel 1:18). No authentic text of that source is included.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "wars-of-the-lord",
    title: "Book of the Wars of the Lord",
    description:
      "Research note (lost work). Numbers 21:14 cites “the book of the wars of the Lord” with a geographical saying about Waheb in Suphah and the valleys of the Arnon. The writing itself is lost. Scripture alone remains authoritative; this page records the biblical reference for research.",
    relatedCanonicalReferences: [
      { label: "Numbers 21:14", book: "Numbers", chapter: 21 },
    ],
    sourceNote: "Lost work. Canonical mention in Numbers 21:14 only.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "acts-of-solomon",
    title: "Book of the Acts of Solomon",
    description:
      "Research note (lost work). 1 Kings 11:41 refers readers to “the book of the acts of Solomon” for the rest of Solomon’s acts and wisdom. That source book is lost. Kings often points to court records behind the canonical summary; those records are not Scripture and are not preserved here.",
    relatedCanonicalReferences: [
      { label: "1 Kings 11:41", book: "1 Kings", chapter: 11 },
    ],
    sourceNote: "Lost work. Canonical mention in 1 Kings 11:41 only.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "letter-from-laodicea",
    title: "Letter from Laodicea (referenced by Paul)",
    description:
      "Research note (lost or unidentified). Colossians 4:16 instructs that the Colossian letter be read also in Laodicea, and that “the letter from Laodicea” be read in Colossae. That Laodicean letter is not preserved as a separate New Testament book. Later writings claiming to be “to the Laodiceans” are not accepted here as Paul’s letter.",
    relatedCanonicalReferences: [
      { label: "Colossians 4:16", book: "Colossians", chapter: 4 },
    ],
    sourceNote:
      "Lost or unidentified correspondence referenced in Colossians 4:16. No authentic text is included.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "chronicles-of-the-kings",
    title: "Chronicles of the kings (royal records)",
    description:
      "Research note (lost works). Kings repeatedly refers to “the book of the chronicles of the kings of Israel” and “the book of the chronicles of the kings of Judah” for further royal details. Those administrative or court records are lost. The canonical books of Kings and Chronicles remain Scripture; the cited sources are placeholders only.",
    relatedCanonicalReferences: [
      { label: "1 Kings 14:19", book: "1 Kings", chapter: 14 },
      { label: "1 Kings 14:29", book: "1 Kings", chapter: 14 },
      { label: "1 Kings 15:7", book: "1 Kings", chapter: 15 },
      { label: "1 Kings 15:23", book: "1 Kings", chapter: 15 },
      { label: "1 Kings 15:31", book: "1 Kings", chapter: 15 },
      { label: "1 Kings 16:5", book: "1 Kings", chapter: 16 },
      { label: "1 Kings 16:14", book: "1 Kings", chapter: 16 },
      { label: "1 Kings 16:20", book: "1 Kings", chapter: 16 },
      { label: "1 Kings 16:27", book: "1 Kings", chapter: 16 },
      { label: "1 Kings 22:39", book: "1 Kings", chapter: 22 },
      { label: "1 Kings 22:45", book: "1 Kings", chapter: 22 },
      { label: "2 Kings 1:18", book: "2 Kings", chapter: 1 },
      { label: "2 Kings 8:23", book: "2 Kings", chapter: 8 },
      { label: "2 Kings 10:34", book: "2 Kings", chapter: 10 },
      { label: "2 Kings 12:19", book: "2 Kings", chapter: 12 },
      { label: "2 Kings 13:8", book: "2 Kings", chapter: 13 },
      { label: "2 Kings 13:12", book: "2 Kings", chapter: 13 },
      { label: "2 Kings 14:15", book: "2 Kings", chapter: 14 },
      { label: "2 Kings 14:28", book: "2 Kings", chapter: 14 },
      { label: "2 Kings 15:6", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:11", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:15", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:21", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:26", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:31", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 15:36", book: "2 Kings", chapter: 15 },
      { label: "2 Kings 16:19", book: "2 Kings", chapter: 16 },
      { label: "2 Kings 20:20", book: "2 Kings", chapter: 20 },
      { label: "2 Kings 21:17", book: "2 Kings", chapter: 21 },
      { label: "2 Kings 21:25", book: "2 Kings", chapter: 21 },
      { label: "2 Kings 23:28", book: "2 Kings", chapter: 23 },
      { label: "2 Kings 24:5", book: "2 Kings", chapter: 24 },
      { label: "2 Chronicles 16:11", book: "2 Chronicles", chapter: 16 },
      { label: "2 Chronicles 25:26", book: "2 Chronicles", chapter: 25 },
      { label: "2 Chronicles 27:7", book: "2 Chronicles", chapter: 27 },
      { label: "2 Chronicles 28:26", book: "2 Chronicles", chapter: 28 },
      { label: "2 Chronicles 32:32", book: "2 Chronicles", chapter: 32 },
      { label: "2 Chronicles 35:27", book: "2 Chronicles", chapter: 35 },
      { label: "2 Chronicles 36:8", book: "2 Chronicles", chapter: 36 },
    ],
    sourceNote:
      "Lost royal or archival records named in Kings and Chronicles. No surviving text is included.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "records-of-the-seers",
    title: "Records of the seers and prophets",
    description:
      "Research note (lost works). Chronicles names prophetic or seer writings used as sources for royal history—for example, the records of Samuel, Nathan, and Gad; the prophecy of Ahijah; visions of Iddo; the book of Shemaiah; the book of Jehu; and “the sayings of the seers.” Those source writings are lost. Scripture’s own books remain authoritative.",
    relatedCanonicalReferences: [
      { label: "1 Chronicles 29:29", book: "1 Chronicles", chapter: 29 },
      { label: "2 Chronicles 9:29", book: "2 Chronicles", chapter: 9 },
      { label: "2 Chronicles 12:15", book: "2 Chronicles", chapter: 12 },
      { label: "2 Chronicles 13:22", book: "2 Chronicles", chapter: 13 },
      { label: "2 Chronicles 20:34", book: "2 Chronicles", chapter: 20 },
      { label: "2 Chronicles 26:22", book: "2 Chronicles", chapter: 26 },
      { label: "2 Chronicles 32:32", book: "2 Chronicles", chapter: 32 },
      { label: "2 Chronicles 33:18-19", book: "2 Chronicles", chapter: 33 },
    ],
    sourceNote:
      "Lost prophetic or seer records cited in Chronicles. No surviving text of those named sources is included.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "book-of-samuel-law",
    title: "Book written by Samuel (1 Samuel 10:25)",
    description:
      "Research note (lost or unpreserved separate record). 1 Samuel 10:25 states that Samuel told the people the rights and duties of kingship, wrote them in a book, and laid it up before the Lord. That particular written record is not preserved as a separate book beyond what Scripture itself reports. The canonical narrative remains our source.",
    relatedCanonicalReferences: [
      { label: "1 Samuel 10:25", book: "1 Samuel", chapter: 10 },
    ],
    sourceNote:
      "Lost or unpreserved separate record mentioned in 1 Samuel 10:25. No additional text is included.",
    isPlaceholder: true,
    sections: [],
  },
];
