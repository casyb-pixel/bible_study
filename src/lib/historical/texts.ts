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
      "Only the opening of 1 Enoch that is traditionally linked to Jude 1:14-15 is shown here (1 Enoch 1, with special attention to 1:9). 1 Enoch as a whole is non-canonical. This excerpt is for research comparison with Jude, not for use as Scripture.",
    relatedCanonicalReferences: [
      { label: "Jude 1:14-15", book: "Jude", chapter: 1 },
    ],
    sourceNote:
      "English from the public-domain R. H. Charles translation of 1 Enoch (1917), chapter 1. Bracketed editorial marks from some printings are omitted for plain reading. Only this Jude-related portion is stored.",
    isPlaceholder: false,
    sections: [
      {
        index: 1,
        text: "Research note: The following is 1 Enoch chapter 1 in the Charles rendering. Jude 1:14-15 is commonly compared with 1 Enoch 1:9. Scripture alone is authoritative; this ancient writing is historical / non-canonical.",
      },
      {
        index: 2,
        text: "1 Enoch 1:1. The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed.",
      },
      {
        index: 3,
        text: "1 Enoch 1:2. And he took up his parable and said—Enoch a righteous man, whose eyes were opened by God, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come.",
      },
      {
        index: 4,
        text: "1 Enoch 1:3-4. Concerning the elect I said, and took up my parable concerning them: The Holy Great One will come forth from His dwelling, and the eternal God will tread upon the earth, even on Mount Sinai, and appear in the strength of His might from the heaven of heavens.",
      },
      {
        index: 5,
        text: "1 Enoch 1:5-7. And all shall be smitten with fear, and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth. And the high mountains shall be shaken, and the high hills shall be made low, and shall melt like wax before the flame. And the earth shall be wholly rent in sunder, and all that is upon the earth shall perish, and there shall be a judgement upon all men.",
      },
      {
        index: 6,
        text: "1 Enoch 1:8. But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them. And they shall all belong to God, and they shall be prospered, and they shall all be blessed. And He will help them all, and light shall appear unto them, and He will make peace with them.",
      },
      {
        index: 7,
        text: "1 Enoch 1:9 (the lines most often compared with Jude 1:14-15). And behold! He cometh with ten thousands of His holy ones to execute judgement upon all, and to destroy all the ungodly: and to convict all flesh of all the works of their ungodliness which they have ungodly committed, and of all the hard things which ungodly sinners have spoken against Him.",
      },
    ],
  },
  {
    id: "jubilees",
    title: "Book of Jubilees (research note)",
    description:
      "A Second Temple Jewish work (often dated roughly to the second century B.C.) that retells material from Genesis and the beginning of Exodus. It is non-canonical. Researchers note its interest in a fixed solar calendar, a detailed creation-week framework, and expanded patriarchal narratives. It must not be read as Scripture.",
    relatedCanonicalReferences: [
      { label: "Genesis 1", book: "Genesis", chapter: 1 },
      { label: "Genesis 5", book: "Genesis", chapter: 5 },
      { label: "Genesis 6", book: "Genesis", chapter: 6 },
      { label: "Genesis 17", book: "Genesis", chapter: 17 },
      { label: "Exodus 12", book: "Exodus", chapter: 12 },
    ],
    sourceNote:
      "Research summary with short illustrative lines after R. H. Charles, The Book of Jubilees (public domain). No continuous narrative is presented as Scripture. Full editions should be consulted separately if needed for deep research.",
    isPlaceholder: false,
    sections: [
      {
        index: 1,
        text: "What it is. The Book of Jubilees (sometimes called “Little Genesis”) retells the storyline of Genesis and early Exodus in a chronological framework of “jubilees” (periods of forty-nine years). It is an ancient Jewish writing, not part of the Protestant canon.",
      },
      {
        index: 2,
        text: "Approximate date. Many place its composition in the second century B.C. Exact dating is a matter of historical research; the important point for this study tool is that the work is later than the Torah and is non-canonical.",
      },
      {
        index: 3,
        text: "Main topics it expands upon. (1) Creation week and ordered time. (2) A solar calendar of 364 days urged as the proper reckoning of festivals. (3) Patriarchal narratives (Adam to Moses’ day) with added chronological and legal detail. Scripture’s own text remains the authority; Jubilees is only a historical companion for research.",
      },
      {
        index: 4,
        text: "Illustrative excerpt (creation / time). Charles, Jubilees 2:1 (opening of the creation account in that work): “And the angel of the presence spake to Moses according to the word of the Lord, saying: Write the complete history of the creation, how in six days the Lord God finished all His works and all that He created, and kept Sabbath on the seventh day and hallowed it for all ages…”",
      },
      {
        index: 5,
        text: "Illustrative excerpt (calendar concern). Charles, Jubilees 6:32 (sample of the work’s calendar emphasis): “And command thou the children of Israel that they observe the years according to this reckoning—three hundred and sixty-four days, and (these) will constitute a complete year…”",
      },
      {
        index: 6,
        text: "Limits of this entry. Only a research summary and two short samples are stored. Long narrative stretches are intentionally omitted so this page cannot be mistaken for a Bible chapter.",
      },
    ],
  },
  {
    id: "jasher",
    title: "Book of Jasher",
    description:
      "The original Book of Jasher named in Scripture is lost. Joshua 10:13 and 2 Samuel 1:18 refer to it when recording events (the sun standing still; the lament over Saul and Jonathan). Later printed works titled “Book of Jasher” are not that ancient source and are not treated as Scripture here.",
    relatedCanonicalReferences: [
      { label: "Joshua 10:13", book: "Joshua", chapter: 10 },
      { label: "2 Samuel 1:18", book: "2 Samuel", chapter: 1 },
    ],
    sourceNote:
      "Lost work. Canonical mentions only. No authentic text of the writing cited in Joshua and 2 Samuel is included.",
    isPlaceholder: true,
    sections: [],
  },
  {
    id: "wars-of-the-lord",
    title: "Book of the Wars of the Lord",
    description:
      "Numbers 21:14 cites “the book of the wars of the Lord” in connection with a geographical saying about Waheb in Suphah and the valleys of the Arnon. The writing itself is lost. Neutral research note: ancient Israelite literature could include war or journey records outside the Torah; we possess only the biblical citation.",
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
      "1 Kings 11:41 refers readers to “the book of the acts of Solomon” for the rest of Solomon’s acts, wisdom, and deeds. That source book is lost. Neutral research note: Kings often points to court or royal records that stood behind the canonical summary.",
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
      "Colossians 4:16 instructs that the Colossian letter be read also in Laodicea, and that “the letter from Laodicea” be read in Colossae. That Laodicean letter is not preserved as a separate book in the New Testament canon. Later writings claiming to be “to the Laodiceans” are not accepted here as Paul’s letter.",
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
      "Kings repeatedly refers to “the book of the chronicles of the kings of Israel” and “the book of the chronicles of the kings of Judah” for further royal details. Those administrative or court records are lost. The canonical books of Kings and Chronicles remain our Scripture; these cited sources are placeholders only.",
    relatedCanonicalReferences: [
      { label: "1 Kings 14:19", book: "1 Kings", chapter: 14 },
      { label: "1 Kings 14:29", book: "1 Kings", chapter: 14 },
      { label: "1 Kings 15:7", book: "1 Kings", chapter: 15 },
      { label: "1 Kings 15:23", book: "1 Kings", chapter: 15 },
      { label: "2 Kings 1:18", book: "2 Kings", chapter: 1 },
      { label: "2 Chronicles 16:11", book: "2 Chronicles", chapter: 16 },
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
      "Chronicles names several prophetic or seer writings used as sources for royal history—for example, the records of Samuel, Nathan, and Gad; the prophecy of Ahijah; visions of Iddo; the book of Shemaiah; the book of Jehu; and “the sayings of the seers.” Those source writings are lost. Scripture’s own books remain authoritative.",
    relatedCanonicalReferences: [
      { label: "1 Chronicles 29:29", book: "1 Chronicles", chapter: 29 },
      { label: "2 Chronicles 9:29", book: "2 Chronicles", chapter: 9 },
      { label: "2 Chronicles 12:15", book: "2 Chronicles", chapter: 12 },
      { label: "2 Chronicles 13:22", book: "2 Chronicles", chapter: 13 },
      { label: "2 Chronicles 20:34", book: "2 Chronicles", chapter: 20 },
      { label: "2 Chronicles 26:22", book: "2 Chronicles", chapter: 26 },
      { label: "2 Chronicles 32:32", book: "2 Chronicles", chapter: 32 },
      { label: "2 Chronicles 33:19", book: "2 Chronicles", chapter: 33 },
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
      "1 Samuel 10:25 states that Samuel told the people the rights and duties of kingship, “wrote them in a book and laid it up before the Lord.” That particular written record is not preserved as a separate book beyond what Scripture itself reports. Neutral research note: the canonical narrative remains our source.",
    relatedCanonicalReferences: [
      { label: "1 Samuel 10:25", book: "1 Samuel", chapter: 10 },
    ],
    sourceNote:
      "Lost or unpreserved separate record mentioned in 1 Samuel 10:25. No additional text is included.",
    isPlaceholder: true,
    sections: [],
  },
];
