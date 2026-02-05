import React, { useEffect, useMemo, useRef, useState } from "react";
import mammoth from "mammoth";
import { FaPen, FaSave } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import { useParams } from "react-router-dom";
import { expertEtaps, inExperts } from "../../api";
import ExpertizeModal from "../../components/expertize";
import { METHOD } from "../../api/zirhrpc";
import { useZirhStref } from "../../context/ZirhContext";
import toast from "react-hot-toast";
import { sendRpcRequest } from "../../rpc/rpcClient";
import { downloadFileViaRpcNew, uploadFileViaRpc } from "../../rpc/fileRpc";
const A4_HEIGHT = 1120;
const A4_CONTENT_HEIGHT = 1120; // A4 content height px
const A4_WIDTH = 794;
const TOC_MAX_HEIGHT = 720;
const SECTION_TABLE_MAX_HEIGHT = 520;

const section1Left = [
  {
    term: "Ma’lumotlar bazasi",
    text:
      "amaliy dasturlarga bog‘liq bo‘lmagan holda, ma’lumotlarni tavsiflash, saqlash va boshqarishning umumiy prinsiplarini ko‘zda tutadigan muayyan qoidalar bo‘yicha tashkil qilingan ma’lumotlar jamlanmasi.",
  },
  {
    term: "Dastur zaifligi",
    text:
      "dasturiy ta’minotni ishlab chiqish davrida dasturchilar tomonidan yo‘l qo‘yilgan xatolik. Mazkur xatoliklar dastur funksional imkoniyatlari va saqlanayotgan ma’lumotlaridan noqonuniy foydalanish, yaxlitligini buzish va noto‘g‘ri ishlashiga olib kelish imkoniyatini beradi.",
  },
  {
    term: "SQL-inyeksiya",
    text:
      "so‘rovlar tanasiga maxsus SQL-kodlarni kiritishga asoslangan, ma’lumotlar bazasi bilan ishlovchi veb-sayt va dasturlarga amalga oshiriladigan hujumlardan biri.",
  },
  {
    term: "OS Command-inyeksiya",
    text:
      "zaif veb-ilovalar yordamida operatsion tizimlarda g‘arazli maqsadga yo‘naltirilgan (bajariluvchi) buyruqlarni amalga oshirishga qaratilgan hujum.",
  },
];

const section1Right = [
  {
    term: "Sintaksis va mantiqiy nuqsonlar",
    text:
      "buferning to‘lib ketishi yoki boshqa turdagi nosozliklarga olib keladi. Ularni aniqlash uzoq vaqt va mashina kodi qismlarida nuqsonlarni bartaraf etish bo‘yicha ishlarni olib borishni talab etadi.",
  },
  {
    term: "Cross-site scripting (XSS)",
    text:
      "veb-tizimlarga amalga oshiriladigan hujum turi bo‘lib, veb-tizim tomonidan taqdim qilinadigan ilovaga zararli kodni yuklash (mazkur kod foydalanuvchi kompyuterida u tomonidan ilova ochilganda ishga tushadi) va uning natijasida g‘araz niyatli shaxsning serveri bilan aloqа o‘rnatishga mo‘ljallangan.",
  },
  {
    term: "CSRF",
    text:
      "HTTP protokolining zaifliklaridan foydalangan holda veb-sayt foydalanuvchilariga qaratilgan hujum turi.",
  },
  {
    term: "Open redirect",
    text:
      "foydalanuvchilarni “phishing” saytlarga yo‘naltirish yoki foydali dasturiy ta’minot ko‘rinishidagi “rootkit” dasturiy to‘plamlarni (maxsus kodlar, dasturlar, konfiguratsiya (sozlama) fayllari va shu kabilar) yuklab olishga undovchi zaiflik.",
  },
  {
    term: "HTML inyeksiya",
    text: "“Hypertext Markup Language” (HTML) -",
  },
];

const htmlInjectionContinuation =
  "gipermatnli belgilash tilida yaratilgan kontentlarga yo‘naltirilgan hujum turi bo‘lib, veb-saytga foydalanuvchi tomonidan kiritiladigan so‘rovlarni qayta ishlash bo‘yicha funksiyalarning yo‘qligi evaziga shaxsiy HTML-kodlarni yuklashga yo‘naltirilgan.";

const section2LeftTerms = [
  {
    term: "Remote code execution",
    text:
      "axborot tizimi yoki resursning dasturiy kodlarida xatoliklardan foydalangan holda maxsus kodlarni bajarish orqali axborot tizimi yoki resurs joylashgan serverni boshqarish imkoniyatini taqdim etuvchi hujum turi.",
  },
  {
    term: "Eksployt",
    text:
      "kompyuter dasturiy komponentlarining zaif tomonlaridan foydalaniladigan zararli kod.",
  },
];

// section2BasisText o'chirildi - contractName komponenti ichida inline ishlatiladi
const section2BasisTextRemoved = "unused"; /*
  `“Kiberxavfsizlik markazi” davlat unitar korxonasi va O‘zbekiston Respublikasi Sport vazirligi huzuridagi “Raqamlashtirish va sertifikatlash markazi” MCHJ o‘rtasida tuzilgan 2025-yil 21-noyabrdagi “ERP sport” yagona elektron boshqaruv tizimini kiberxavfsizlik talablariga muvofiqligi yuzasidan ekspertizadan o‘tkazish to‘g‘risidagi ${contractName}-son shartnoma.`; */

const section2ObjectLinks = [
  "https://5tashabbus.uz",
  "https://adm2.sport.uz",
  "https://dash2.sport.uz",
  "https://erp2.sport.uz",
  "https://my2.sport.uz",
  "https://mass2.sport.uz",
  "https://pr2.sport.uz",
];

const section2ProcessIntro =
  "Axborot tizimi ekspertizasi quyidagi ikki xil usulga asoslangan holda amalga oshirildi:";

const section2ProcessItems = [
  {
    term: "“BlackBox” usuli",
    text:
      "“Qora quti” faqatgina axborot tizimini tashqi tomondan kiberxavfsizlik harakatlariga zaif ekanligi o‘rganiladi va ushbu usulga asoslangan o‘rganish haqiqiy vaziyatga imkon qadar yaqin.",
  },
  {
    term: "“WhiteBox” usuli",
    text:
      "“Oq quti” axborot tizimi to‘g‘risida ma’lumotlarga, xususan axborot tizimidan foydalanish uchun login va parollar, foydalanilgan dasturiy texnologiyalar, axborot tizimi",
  },
];

const whiteBoxContinuation =
  "doirasidagi axborot resurslari to‘g‘risida ma’lumotlarga ega bo‘lgan holda o‘rganish.";

const section3Intro =
  "Ekspertiza davrida kiberxavfsizlik zaifliklarini aniqlash bo‘yicha ishlar olib borildi, jumladan axborot tizimida quyidagi kiberxavfsizlik zaifliklarini mavjudligi tekshirildi:";

const section3BulletsLeft = [
  "SQL-inyeksiya va uning turlari;",
  "OS Command injeksiya;",
  "Cross-site scripting (XSS);",
  "bajariluvchi fayllarni yuklash;",
  "CSRF;",
  "Remote code execution;",
  "Open redirect;",
  "autentifikatsiya jarayonidagi xatoliklar;",
  "barcha uchun ochiq holda bo‘lgan ma’lumotlar, formlar va shu kabilar;",
];

const section3BulletsRight = [
  "avtorizatsiya jarayonining noto‘g‘ri yoki yetarli darajada bo‘lmaganlik holati;",
  "funksional imkoniyatlarni noto‘g‘ri taqsimlash;",
  "muhim resurslarga ruxsat berish va ulardan foydalanishni tartibga solinmaganlik holati;",
  "katta hajmdagi autentifikatsiya urinishlarini qayta ishlashda xatoliklar;",
  "ma’lumotlarni chiqib ketishga olib keluvchi xatoliklar;",
  "parollar tanlovidan himoyalanmaganlik holatlari va boshqalar.",
];

const section3TableIntro =
  "Axborot tizimi ekspertizasi 1-jadvalda taqdim etilgan ketma-ketlikda tadbirlarni amalga oshirish orqali amalga oshirildi";

const section3TableRows = [
  "Axborot tizimi to‘g‘risida ma’lumotlar to‘plash va ularni tahlil qilish",
  "Axborot tizimi formalari, bo‘limlari va tashkil etuvchilarida zaifliklar mavjudligiga tekshirish",
  "Axborot tizimi dasturiy ta’minotlari va xizmatlarida zaifliklar mavjudligiga tekshirish",
  "Axborot tizimi va uning ish jarayoni hamda funksional imkoniyatlari, shuningdek axborot tizimi ma’muri tomonidan yo‘l qo‘yilgan xatoliklar mavjudligiga tekshirish",
];


const buildSectionTableRowHtml = (row, index) => `
  <tr>
    <td>${index + 1}.</td>
    <td>${row}</td>
  </tr>
`;

const vulnerabilityTemplates = {
  integrity: `
    <div class="a4">
      <div class="page-content">
        <div class="exp-title">
          Ilovada o‘zining yaxlitligini tekshirish mexanizmi joriy etilmaganligi
        </div>
        <div class="exp-d">
          <b>Xavflilik darajasi:</b> Yuqori
        </div>
        <div class="text">
          Ilova o‘z kodlari yaxlitligini tekshirmaydi...
        </div>
      </div>
    </div>
  `,
  sql: `
    <div class="a4">
      <div class="page-content">
        <div class="exp-title">SQL Injection</div>
        <div class="exp-d"><b>Xavflilik darajasi:</b> O‘rta</div>
      </div>
    </div>
  `,
};

let vulnCounter = 1;

const parseVulnByLevel = (payloads) => {
  const high = [],
    medium = [],
    low = [];
  (payloads || []).forEach((p) => {
    const arr = p[13] || p[12] || p[11];
    const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
    list.forEach((v) => {
      if (!v || v.a1 == null) return;
      const item = { a1: v.a1, a2: v.a2, a3: v.a3 };
      const lev = Number(v.a1) || v.a1;
      if (lev === 1) high.push(item);
      else if (lev === 2) medium.push(item);
      else if (lev === 3) low.push(item);
    });
  });
  return { high, medium, low };
};

const buildTocItemHtml = (item) => {
  if (item.type === "section") {
    return `
      <div class="content-title"><span>${item.page}</span></div>
      <div class="mundarija-section">${item.section}</div>
      <div class="mundarija-head">${item.head}</div>
    `;
  }

  if (item.type === "subheader") {
    return `
      <div class="mundarija-row system-mundarija-row">
        <div class="row-title large"><b>${item.title}</b></div>
        <div class="row-num text-nowrap">${item.page || ""}</div>
      </div>
    `;
  }

  return `
    <div class="mundarija-row system-mundarija-row">
      <div class="row-title ${item.large ? "large" : ""}">${item.title}</div>
      <div class="row-num text-nowrap">${item.page || ""}</div>
    </div>
  `;
};

const paginateTocItems = (items) => {
  if (!items.length) return [];
  const pages = [];
  const measure = document.createElement("div");
  measure.style.width = "794px";
  measure.style.position = "absolute";
  measure.style.visibility = "hidden";
  measure.style.top = "-9999px";
  measure.style.maxHeight = "none";
  measure.style.overflow = "visible";

  const measureContent = document.createElement("div");
  measureContent.className = "mundarija-content mundarija-content-system";
  measure.appendChild(measureContent);
  document.body.appendChild(measure);

  let currentPage = [];
  items.forEach((itemHtml) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = itemHtml;
    measureContent.appendChild(wrapper);

    if (measureContent.scrollHeight > TOC_MAX_HEIGHT) {
      measureContent.removeChild(wrapper);
      if (currentPage.length) pages.push(currentPage);
      currentPage = [itemHtml];
      measureContent.innerHTML = itemHtml;
    } else {
      currentPage.push(itemHtml);
    }
  });

  if (currentPage.length) pages.push(currentPage);
  document.body.removeChild(measure);
  return pages;
};

const paginateSectionTableRows = (rowsHtml) => {
  if (!rowsHtml.length) return [];
  const pages = [];
  const measure = document.createElement("div");
  measure.style.width = "794px";
  measure.style.position = "absolute";
  measure.style.visibility = "hidden";
  measure.style.top = "-9999px";

  const table = document.createElement("table");
  table.className = "system-table";
  table.innerHTML =
    "<thead><tr><th style=\"width:50px\">T/r</th><th>Tadbir nomi</th></tr></thead><tbody></tbody>";

  measure.appendChild(table);
  document.body.appendChild(measure);

  const tbody = table.querySelector("tbody");
  let currentPage = [];

  rowsHtml.forEach((rowHtml) => {
    const temp = document.createElement("tbody");
    temp.innerHTML = rowHtml;
    const row = temp.firstElementChild;
    if (!row) return;

    tbody.appendChild(row);

    if (table.scrollHeight > SECTION_TABLE_MAX_HEIGHT) {
      tbody.removeChild(row);
      if (currentPage.length) pages.push(currentPage);
      currentPage = [rowHtml];
      tbody.innerHTML = rowHtml;
    } else {
      currentPage.push(rowHtml);
    }
  });

  if (currentPage.length) pages.push(currentPage);
  document.body.removeChild(measure);
  return pages;
};

const chunkSystemAccountsRows = (rows, firstPageSize = 8, nextPageSize = 14) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return [[]];

  const pages = [];
  let i = 0;
  let size = firstPageSize;

  while (i < safeRows.length) {
    pages.push(safeRows.slice(i, i + size));
    i += size;
    size = nextPageSize;
  }

  return pages.length ? pages : [[]];
};

const extractResourceHost = (value = "") => {
  const raw = (value ?? "").toString().trim();
  if (!raw) return "";
  try {
    const url =
      raw.startsWith("http://") || raw.startsWith("https://")
        ? new URL(raw)
        : new URL(`https://${raw}`);
    return (url.hostname || raw).replace(/^www\./i, "");
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "");
  }
};

const riskLevelText = (level) =>
  Number(level) === 1 ? "Yuqori" : Number(level) === 2 ? "O‘rta" : "Past";

const riskRowClass = (level) =>
  Number(level) === 1 ? "risk-high" : Number(level) === 2 ? "risk-medium" : "risk-low";

const chunkRiskRows = (rows, firstPageSize = 8, nextPageSize = 28) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return [];

  const pages = [];
  let i = 0;
  let size = firstPageSize;

  while (i < safeRows.length) {
    const page = [];
    const cap = size;

    while (i < safeRows.length && page.length < cap) {
      const row = safeRows[i];

      // agar sahifa resource header bilan emas, vuln qatoridan boshlansa headerni takrorlab qo'yamiz
      if (page.length === 0 && row?.type === "vuln" && row?.resourceLabel) {
        page.push({ type: "resource", label: row.resourceLabel, repeated: true });
      }

      page.push(row);
      i++;
    }

    // resource header sahifa oxirida qolib ketmasin
    if (page.length && page[page.length - 1]?.type === "resource") {
      page.pop();
      i = Math.max(0, i - 1);
    }

    if (page.length) pages.push(page);
    size = nextPageSize;
  }

  return pages;
};

const takeRiskRows = (rows, startIndex, cap) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  let i = Math.max(0, startIndex || 0);
  const page = [];

  while (i < safeRows.length && page.length < cap) {
    const row = safeRows[i];

    // agar sahifa/ustun resource header bilan emas, vuln qatoridan boshlansa headerni takrorlab qo'yamiz
    if (page.length === 0 && row?.type === "vuln" && row?.resourceLabel) {
      page.push({ type: "resource", label: row.resourceLabel, repeated: true });
    }

    page.push(row);
    i++;
  }

  // resource header sahifa/ustun oxirida qolib ketmasin
  if (page.length && page[page.length - 1]?.type === "resource") {
    page.pop();
    i = Math.max(0, i - 1);
  }

  return { page, nextIndex: i };
};

const RISK_COL_WIDTH_PX = 315;
const RISK_COL_MAX_HEIGHT_PX = 560;

const buildRiskMeasureRow = (row) => {
  const tr = document.createElement("tr");
  if (row?.type === "resource") {
    tr.className = "risk-resource";
    tr.innerHTML = `<td colSpan="3">“${row.label}” resursi</td>`;
    return tr;
  }

  tr.className = riskRowClass(row?.level);
  tr.innerHTML = `
    <td class="risk-level">${riskLevelText(row?.level)}</td>
    <td class="risk-name">${row?.name ?? ""}</td>
    <td class="risk-count">${row?.count ?? ""}</td>
  `;
  return tr;
};

const takeRiskRowsByHeight = (rows, startIndex, maxHeightPx = RISK_COL_MAX_HEIGHT_PX) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  let i = Math.max(0, startIndex || 0);
  const out = [];

  // hidden measure container
  const measure = document.createElement("div");
  measure.style.width = `${RISK_COL_WIDTH_PX}px`;
  measure.style.position = "absolute";
  measure.style.visibility = "hidden";
  measure.style.top = "-9999px";
  measure.style.left = "-9999px";
  measure.style.pointerEvents = "none";

  const table = document.createElement("table");
  table.className = "system-risk-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Xavflilik darajasi</th>
        <th>Aniqlangan zaiflik</th>
        <th>Soni</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  measure.appendChild(table);
  document.body.appendChild(measure);

  const tbody = table.querySelector("tbody");
  const tryAppend = (row) => {
    const tr = buildRiskMeasureRow(row);
    tbody.appendChild(tr);
    const ok = table.scrollHeight <= maxHeightPx;
    if (!ok) tbody.removeChild(tr);
    return ok;
  };

  while (i < safeRows.length) {
    let consumedIndex = false;
    let row = safeRows[i];

    // agar sahifa/ustun resource header bilan emas, vuln qatoridan boshlansa headerni takrorlaymiz
    if (out.length === 0 && row?.type === "vuln" && row?.resourceLabel) {
      const injected = { type: "resource", label: row.resourceLabel, repeated: true };
      if (tryAppend(injected)) {
        out.push(injected);
      }
      // injected row index iste'mol qilinmaydi
      continue;
    }

    // normal row
    consumedIndex = true;
    const canFit = tryAppend(row);
    if (!canFit) {
      // hech bo'lmasa bitta row o'tishi kerak (aks holda infinite loop bo'lishi mumkin)
      if (out.length === 0) {
        // majburan qo'shamiz
        const tr = buildRiskMeasureRow(row);
        tbody.appendChild(tr);
        out.push(row);
        i += 1;
      }
      break;
    }

    out.push(row);
    if (consumedIndex) i += 1;
  }

  // resource header oxirida qolib ketmasin
  if (out.length && out[out.length - 1]?.type === "resource") {
    const last = out[out.length - 1];
    out.pop();
    if (!last.repeated) i = Math.max(0, i - 1);
  }

  document.body.removeChild(measure);
  return { page: out, nextIndex: i };
};

const chunkRiskColumnPages = (rows, startIndex, leftCap = 14, rightCap = 14) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  let i = Math.max(0, startIndex || 0);
  const pages = [];

  while (i < safeRows.length) {
    const left = takeRiskRowsByHeight(safeRows, i, RISK_COL_MAX_HEIGHT_PX);
    i = left.nextIndex;

    const right = takeRiskRowsByHeight(safeRows, i, RISK_COL_MAX_HEIGHT_PX);
    i = right.nextIndex;

    if (!left.page.length && !right.page.length) break;
    pages.push({ left: left.page, right: right.page });
  }

  return pages;
};

const computeRiskLevelRowspanMeta = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const meta = safeRows.map(() => ({ showLevel: false, rowSpan: 1 }));
  if (safeRows.length === 0) return meta;

  let idx = 0;
  while (idx < safeRows.length) {
    // segment boundaries: between resource header rows
    if (safeRows[idx]?.type === "resource") {
      idx += 1;
      continue;
    }

    let end = idx;
    while (end < safeRows.length && safeRows[end]?.type !== "resource") end += 1;

    let i = idx;
    while (i < end) {
      const row = safeRows[i];
      if (row?.type !== "vuln") {
        i += 1;
        continue;
      }

      const level = Number(row?.level);
      let j = i + 1;
      while (
        j < end &&
        safeRows[j]?.type === "vuln" &&
        Number(safeRows[j]?.level) === level
      ) {
        j += 1;
      }

      meta[i] = { showLevel: true, rowSpan: j - i };
      for (let k = i + 1; k < j; k++) meta[k] = { showLevel: false, rowSpan: 1 };

      i = j;
    }

    idx = end;
  }

  return meta;
};

const SystemWord = () => {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageRefs = useRef([]);
  const editingRef = useRef(false);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  const [expertize, setExpertize] = useState([]);
  const [appName, setAppName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgTypeName, setOrgTypeName] = useState("");
  const [contractName, setContractName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [htmlContent, setHtmlContent] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [highVuln, setHighVuln] = useState([]);
  const [mediumVuln, setMediumVuln] = useState([]);
  const [lowVuln, setLowVuln] = useState([]);
  const [vuln, setVuln] = useState([]);
  const [contractDate, setContractDate] = useState("");
  const [allVuln, setAllVuln] = useState([]);
  const [newVuln, setNewVuln] = useState([]);
  const [pages1, setPages1] = useState([]);
  const [tableData, setTableData] = useState({});
  const [rows, setRows] = useState([]);
  const [apkFileName, setApkFileName] = useState("");
  const [ipaFileName, setIpaFileName] = useState("");
  const [vulnAndroid, setVulnAndroid] = useState([]);
  const [vulnIOS, setVulnIOS] = useState([]);
  const [vulnUm, setVulnUm] = useState([]);
  const [platform, setPlatform] = useState("umumiy");
  const [pages2, setPages2] = useState([]);
  const [pages3, setPages3] = useState([]);
  const [tocPages, setTocPages] = useState([]);
  const [sectionTablePages, setSectionTablePages] = useState([]);
  const [objectLinks, setObjectLinks] = useState(section2ObjectLinks);
  const [objectLinksText, setObjectLinksText] = useState(section2ObjectLinks.join("\n"));
  const [systemAccountsRows, setSystemAccountsRows] = useState([]);
  const [uploadedFilesMeta, setUploadedFilesMeta] = useState({});
  const [uploadedFilesList, setUploadedFilesList] = useState([]);
  const uploadedFilesListRef = useRef([]);

  const normalizeCellValue = (v) => (v ?? "").toString().trim();

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    uploadedFilesListRef.current = uploadedFilesList;
  }, [uploadedFilesList]);

  const computeRowSpanMeta = (rows, key) => {
    const meta = rows.map((_, idx) => ({
      rowSpan: 1,
      hidden: false,
      start: idx,
      end: idx,
    }));

    for (let i = 0; i < rows.length; i++) {
      if (meta[i].hidden) continue;
      const value = normalizeCellValue(rows[i]?.[key]);
      if (!value) continue;

      let j = i + 1;
      while (j < rows.length && normalizeCellValue(rows[j]?.[key]) === value) {
        meta[j].hidden = true;
        j++;
      }

      meta[i].rowSpan = j - i;
      for (let k = i; k < j; k++) {
        meta[k].start = i;
        meta[k].end = j - 1;
      }

      i = j - 1;
    }

    return meta;
  };

  const systemAccountsPages = useMemo(() => {
    // NOTE: row height wrap bo‘lishi mumkin, shuning uchun hozircha stabil bo‘lishi uchun
    // qator-soni bo‘yicha bo‘lamiz (Worddagi kabi keyingi sahifaga o‘tadi, yo‘qolib qolmaydi).
    return chunkSystemAccountsRows(systemAccountsRows, 6, 14);
  }, [systemAccountsRows]);

  const systemAccountsPageStarts = useMemo(() => {
    const starts = [];
    let acc = 0;
    for (const pageRows of systemAccountsPages) {
      starts.push(acc);
      acc += pageRows.length;
    }
    return starts;
  }, [systemAccountsPages]);

  const addSystemAccountsRow = () => {
    setSystemAccountsRows((prev) => [
      ...prev,
      { role: "", url: "", login: "", password: "" },
    ]);
  };

  const deleteSystemAccountsRow = (rowIdx) => {
    setSystemAccountsRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  const updateSystemAccountsCell = (rowIdx, field, value, range) => {
    setSystemAccountsRows((prev) => {
      if (!prev[rowIdx]) return prev;
      const next = prev.map((r) => ({ ...r }));

      if (
        range &&
        Number.isInteger(range.start) &&
        Number.isInteger(range.end) &&
        range.start >= 0 &&
        range.end < next.length
      ) {
        for (let i = range.start; i <= range.end; i++) {
          next[i] = { ...next[i], [field]: value };
        }
        return next;
      }

      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };

  const renderSystemAccountsTable = ({
    pageRows,
    globalStartIndex,
    showAddButton = false,
  }) => {
    const roleMeta = computeRowSpanMeta(pageRows, "role");
    const urlMeta = computeRowSpanMeta(pageRows, "url");

    return (
      <>
        <table
          className="system-table system-table-compact"
          contentEditable={false}
        >
          <thead>
            <tr>
              <th style={{ width: "50px" }}>T/r</th>
              <th style={{ width: "140px" }}>Rol</th>
              <th>URL manzil</th>
              <th style={{ width: "140px" }}>Login</th>
              <th style={{ width: "140px" }}>Parol</th>
              {editing && <th style={{ width: "48px" }}></th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => {
              const globalIdx = globalStartIndex + idx;
              const rMeta = roleMeta[idx];
              const uMeta = urlMeta[idx];

              return (
                <tr key={globalIdx}>
                  <td>{globalIdx + 1}.</td>

                  {!rMeta?.hidden && (
                    <td rowSpan={rMeta?.rowSpan || 1}>
                      {editing ? (
                        <textarea
                          value={row.role}
                          onChange={(e) =>
                            updateSystemAccountsCell(
                              globalIdx,
                              "role",
                              e.target.value,
                              rMeta?.rowSpan > 1
                                ? {
                                    start: globalStartIndex + rMeta.start,
                                    end: globalStartIndex + rMeta.end,
                                  }
                                : undefined,
                            )
                          }
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          rows={1}
                          className="w-full bg-transparent outline-none resize-none overflow-hidden"
                          placeholder="Rol"
                        />
                      ) : (
                        row.role
                      )}
                    </td>
                  )}

                  {!uMeta?.hidden && (
                    <td rowSpan={uMeta?.rowSpan || 1}>
                      {editing ? (
                        <textarea
                          value={row.url}
                          onChange={(e) =>
                            updateSystemAccountsCell(
                              globalIdx,
                              "url",
                              e.target.value,
                              uMeta?.rowSpan > 1
                                ? {
                                    start: globalStartIndex + uMeta.start,
                                    end: globalStartIndex + uMeta.end,
                                  }
                                : undefined,
                            )
                          }
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          rows={1}
                          className="w-full bg-transparent outline-none resize-none overflow-hidden"
                          placeholder="https://..."
                        />
                      ) : (
                        <u>{row.url}</u>
                      )}
                    </td>
                  )}

                  <td>
                    {editing ? (
                      <textarea
                        value={row.login}
                        onChange={(e) =>
                          updateSystemAccountsCell(globalIdx, "login", e.target.value)
                        }
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        rows={1}
                        className="w-full bg-transparent outline-none resize-none overflow-hidden"
                        placeholder="Login"
                      />
                    ) : (
                      row.login
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <textarea
                        value={row.password}
                        onChange={(e) =>
                          updateSystemAccountsCell(
                            globalIdx,
                            "password",
                            e.target.value,
                          )
                        }
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        rows={1}
                        className="w-full bg-transparent outline-none resize-none overflow-hidden"
                        placeholder="Parol"
                      />
                    ) : (
                      row.password
                    )}
                  </td>

                  {editing && (
                    <td contentEditable={false}>
                      <button
                        type="button"
                        onClick={() => deleteSystemAccountsRow(globalIdx)}
                        className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                        title="Qatorni o‘chirish"
                      >
                        <iconify-icon
                          icon="material-symbols:delete"
                          width="18"
                          height="18"
                        />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {editing && showAddButton && (
          <div className="mt-2 flex justify-end" contentEditable={false}>
            <button
              type="button"
              onClick={addSystemAccountsRow}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow"
              title="Qator qo‘shish"
            >
              <iconify-icon icon="material-symbols:add" width="20" height="20" />
            </button>
          </div>
        )}
      </>
    );
  };

  const pdfRef = useRef();
  const { stRef } = useZirhStref();

  const printRef = useRef(null);
  const { id } = useParams();

  const androidVulns = useMemo(
    () => parseVulnByLevel(vulnAndroid),
    [vulnAndroid],
  );
  const iosVulns = useMemo(() => parseVulnByLevel(vulnIOS), [vulnIOS]);
  const umVulns = useMemo(() => parseVulnByLevel(vulnUm), [vulnUm]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${appName}-${Date.now()}`,
  });

  const startIndex = htmlContent.findIndex((p) =>
    p.includes(
      "2.2. Android mobil ilovasi ekspertizasi natijalari bo‘yicha batafsil izoh",
    ),
  );

  const sectionTableRowHtml = useMemo(
    () => section3TableRows.map((row, index) => buildSectionTableRowHtml(row, index)),
    [],
  );


  const createNewA4Page = () => {
    // Get the container where pages are stored
    const wordContainer = document.querySelector(".word-container");
    if (!wordContainer) return;

    // Get last page to copy styling
    const lastPage = wordContainer.querySelector(".a4:last-child");
    const pageNumber = wordContainer.querySelectorAll(".a4").length;

    // Create new A4 page
    const newPage = document.createElement("div");
    newPage.className = "a4";
    newPage.style.backgroundImage =
      pageNumber % 2 === 0
        ? `url("/assets/word/2.png")`
        : `url("/assets/word/3.png")`;

    // Add page title
    const pageTitle = document.createElement("div");
    pageTitle.className = "page-title";
    pageTitle.innerHTML = `<div>"${appName}"</div><div>mobil ilovasi</div>`;
    newPage.appendChild(pageTitle);

    // Add page content
    const pageContent = document.createElement("div");
    pageContent.className = "page-content editable";
    newPage.appendChild(pageContent);

    // Add page number
    const pageNumber_div = document.createElement("div");
    pageNumber_div.className = "page-number flex justify-center mt-auto";
    pageNumber_div.innerHTML = `<span>${pageNumber}</span>`;
    newPage.appendChild(pageNumber_div);

    // Add to container
    wordContainer.appendChild(newPage);

    // Re-attach event listeners to new page
    const editables = document.querySelectorAll(".editable");
    editables.forEach((el) => {
      el.contentEditable = editing;
      el.style.outline = editing ? "1px dashed #4f46e5" : "none";
    });

    return newPage;
  };
  const handlePageOverflow = () => {
    let a4Pages = document.querySelectorAll(".a4");
    const MAX_HEIGHT = 850;

    // Multiple iterations to ensure all overflow is handled and empty spaces are filled
    for (let iteration = 0; iteration < 10; iteration++) {
      a4Pages = document.querySelectorAll(".a4"); // Refresh pages list
      let hasChanges = false;

      // Step 1: Handle overflow - move content to next page if too much
      for (let pageIndex = 0; pageIndex < a4Pages.length; pageIndex++) {
        const pageEl = a4Pages[pageIndex];
        const pageContent = pageEl.querySelector(".page-content");
        if (!pageContent) continue;

        const actualHeight = pageContent.scrollHeight;

        if (actualHeight > MAX_HEIGHT) {
          const children = Array.from(pageContent.children);
          let currentHeight = 0;
          let splitAtIndex = -1;

          // Smart height-based split with minimum content check
          for (let i = 0; i < children.length; i++) {
            const childHeight = children[i].offsetHeight || 0;
            if (currentHeight + childHeight > MAX_HEIGHT) {
              splitAtIndex = i;
              break;
            }
            currentHeight += childHeight;
          }

          // If we found a split point, move content
          if (splitAtIndex > 0 && splitAtIndex < children.length) {
            hasChanges = true;
            // Create a copy of elements to move (to avoid array mutation issues)
            const toMove = Array.from(children).slice(splitAtIndex);

            // Get or create next page
            let nextPageEl = a4Pages[pageIndex + 1];
            if (!nextPageEl) {
              nextPageEl = createNewA4Page();
              // Refresh pages list after creating new page
              a4Pages = document.querySelectorAll(".a4");
            }

            const nextPageContent = nextPageEl.querySelector(".page-content");
            if (nextPageContent) {
              // Move elements to next page (in reverse order to avoid index issues)
              for (let i = toMove.length - 1; i >= 0; i--) {
                const el = toMove[i];
                // Check if element is still in DOM before removing
                if (el && el.parentNode === pageContent) {
                  nextPageContent.insertBefore(
                    el.cloneNode(true),
                    nextPageContent.firstChild,
                  );
                  // Remove from current page only if it's still a child
                  if (el.parentNode === pageContent) {
                    el.remove();
                  }
                }
              }
            }
          }
        }
      }

      a4Pages = document.querySelectorAll(".a4");
      for (let pageIndex = 0; pageIndex < a4Pages.length - 1; pageIndex++) {
        const currentPageEl = a4Pages[pageIndex];
        const currentPageContent = currentPageEl.querySelector(".page-content");
        if (!currentPageContent) continue;

        const currentHeight = currentPageContent.scrollHeight;
        const availableSpace = MAX_HEIGHT - currentHeight;

        if (availableSpace > 20) {
          const nextPageEl = a4Pages[pageIndex + 1];
          const nextPageContent = nextPageEl.querySelector(".page-content");
          if (!nextPageContent) continue;

          const nextPageChildren = Array.from(nextPageContent.children);
          if (nextPageChildren.length === 0) continue;

          let contentToMove = [];
          let contentHeight = 0;

          for (let i = 0; i < nextPageChildren.length; i++) {
            const child = nextPageChildren[i];
            if (!child || !child.parentNode) continue;

            const childHeight = child.offsetHeight || 0;
            if (childHeight === 0) continue;
            const spaceWithMargin = availableSpace - 10;
            if (contentHeight + childHeight <= spaceWithMargin) {
              contentToMove.push(child);
              contentHeight += childHeight;
            } else {
              if (i === 0) {
                break;
              }
              break;
            }
          }

          if (contentToMove.length > 0) {
            hasChanges = true;
            for (let i = contentToMove.length - 1; i >= 0; i--) {
              const el = contentToMove[i];
              if (el && el.parentNode === nextPageContent) {
                const cloned = el.cloneNode(true);
                currentPageContent.appendChild(cloned);
                if (el.parentNode === nextPageContent) {
                  el.remove();
                }
              }
            }

            void currentPageContent.offsetHeight;
            void nextPageContent.offsetHeight;
          }
        }
      }

      if (!hasChanges) {
        break;
      }
    }
  };

  const handleImageResize = () => {
    const images = document.querySelectorAll(".page-content img");
    images.forEach((img) => {
      const pageContent = img.closest(".page-content");
      if (pageContent) {
        const maxWidth = 500;
        if (img.width > maxWidth) {
          const aspectRatio = img.height / img.width;
          img.style.width = maxWidth + "px";
          img.style.height = maxWidth * aspectRatio + "px";
        }
      }
    });
  };

  useEffect(() => {
    const editables = document.querySelectorAll(".editable");

    const attachImageResizeHandler = () => {
      // IMPORTANT: handler editing holatiga bog'liq bo'lmasin (closure muammosi).
      // Shuning uchun har safar barcha rasmlarga handlerni yangilaymiz.
      const images = document.querySelectorAll(".page-content img");

      images.forEach((img) => {
        let startX, startY, startWidth, startHeight;

        const onPointerMove = (e) => {
          if (!editingRef.current) return;
          e.preventDefault();
          e.stopPropagation();

          const deltaX = e.clientX - startX;
          const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
          const aspectRatio = startHeight / startWidth;
          const newHeight = newWidth * aspectRatio;

          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;
          img.style.maxWidth = "none";
        };

        const onPointerUp = (e) => {
          document.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerup", onPointerUp);
          handlePageOverflow?.(); // agar funksiya mavjud bo‘lsa
        };

        const onPointerDown = (e) => {
          if (!editingRef.current || e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();

          // HAR DOIM HOZIRGI O‘LCHAMNI OLAMIZ
          startX = e.clientX;
          startY = e.clientY;
          const rect = img.getBoundingClientRect();
          startWidth = rect.width;
          startHeight = rect.height;

          document.addEventListener("pointermove", onPointerMove, {
            passive: false,
          });
          document.addEventListener("pointerup", onPointerUp, {
            passive: false,
          });
        };

        // Eski handler bo‘lsa – olib tashlaymiz (xavfsizlik)
        img.removeEventListener("pointerdown", img._resizeHandler);
        img._resizeHandler = onPointerDown;
        img.addEventListener("pointerdown", onPointerDown, { passive: false });

        // Vizual holatni yangilash
        img.style.cursor = editingRef.current ? "ew-resize" : "default";
        img.style.border = editingRef.current ? "1px dashed #aaa" : "none";
        img.style.userSelect = "none";
      });
    };

    attachImageResizeHandler();
    if (editing) {
      attachImageResizeHandler();
    }
    const handleInput = (e) => {
      // Just handle images on input, don't trigger page overflow
      handleImageResize();
      attachImageResizeHandler();

      // Immediately check if content overflows and trim it
      const editables = document.querySelectorAll(".page-content");
      editables.forEach((pageContent) => {
        const MAX_HEIGHT = 900;
        if (pageContent.scrollHeight > MAX_HEIGHT) {
          // Find and remove excess content
          const children = Array.from(pageContent.children);
          let currentHeight = 0;

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            currentHeight += child.offsetHeight;

            if (currentHeight > MAX_HEIGHT) {
              // Remove this and all subsequent elements
              for (let j = children.length - 1; j >= i; j--) {
                children[j].remove();
              }
              break;
            }
          }
        }
      });
    };

    const handlePaste = (e) => {
      // Handle images in clipboard
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let hasImage = false;

      for (let item of items) {
        if (item.kind === "file" && item.type.indexOf("image") !== -1) {
          hasImage = true;
          // Prevent default paste behavior only for images to insert custom HTML
          e.preventDefault();

          const clipboardFile = item.getAsFile();
          const reader = new FileReader();

          reader.onload = (event) => {
            const imgElement = document.createElement("img");
            imgElement.src = event.target.result;

            // MUHIM: src keyinroq o'zgarsa ham cheksiz sikl bo'lmasligi uchun
            // bu blok faqat 1 marta ishlasin
            if (imgElement.dataset.pasteInit === "true") return;
            imgElement.dataset.pasteInit = "true";

            imgElement.addEventListener("load", () => {
              // Image loaded, resize it
              const maxWidth = 500;
              if (imgElement.width > maxWidth) {
                const aspectRatio = imgElement.height / imgElement.width;
                imgElement.style.width = maxWidth + "px";
                imgElement.style.height = maxWidth * aspectRatio + "px";
              } else {
                imgElement.style.width = imgElement.width + "px";
                imgElement.style.height = imgElement.height + "px";
              }

              // Set styles for resize
              imgElement.style.cursor = "ew-resize";
              imgElement.style.display = "inline-block";
              imgElement.style.border = "1px solid #ddd";
              imgElement.style.margin = "10px auto";
              imgElement.style.userSelect = "none";
              imgElement.className = "resizable-image";

              // Insert image after a slight delay to allow paste to complete
              setTimeout(() => {
                // Get current selection and insert image
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const wrapper = document.createElement("p");
                  wrapper.style.textAlign = "center";
                  wrapper.appendChild(imgElement);
                  range.insertNode(wrapper);

                  // Move cursor after image
                  range.setStartAfter(wrapper);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }

                // Upload pasted image to server via RPC
                if (clipboardFile) {
                  // 1 martadan ko'p upload bo'lmasin (src yangilansa ham)
                  if (imgElement.dataset.uploadStarted === "true") return;
                  imgElement.dataset.uploadStarted = "true";

                  imgElement.style.opacity = "0.7";
                  imgElement.dataset.uploading = "true";
                  Promise.resolve()
                    .then(() => handlePasteImage(clipboardFile, imgElement))
                    .catch((err) => console.log(err))
                    .finally(() => {
                      imgElement.style.opacity = "1";
                      delete imgElement.dataset.uploading;
                    });
                }

                // Trigger reflow and handle overflow
                editables.forEach((el) => {
                  void el.offsetHeight;
                });

                // Attach resize handler to the new image with a small delay
                setTimeout(() => {
                  // Ensure image is in DOM before attaching handler
                  if (imgElement && imgElement.parentNode) {
                    // Use the same approach as makeImagesResizable for consistency
                    if (imgElement.dataset.resizable) {
                      // Already has handler, just update styles
                      imgElement.style.cursor = editing
                        ? "ew-resize"
                        : "default";
                      imgElement.style.border = editing
                        ? "1px solid #ddd"
                        : "none";
                    } else {
                      // Mark as resizable
                      imgElement.dataset.resizable = "true";
                      imgElement.style.cursor = editing
                        ? "ew-resize"
                        : "default";
                      imgElement.style.display = "inline-block";
                      imgElement.style.userSelect = "none";
                      imgElement.style.border = editing
                        ? "1px solid #ddd"
                        : "none";
                      imgElement.style.margin = "10px auto";

                      // Use pointer events for better compatibility (same as makeImagesResizable)
                      let startX, startY, startWidth, startHeight;

                      const onPointerMove = (e) => {
                        if (!editing) return;
                        e.preventDefault();
                        e.stopPropagation();

                        const deltaX = e.clientX - startX;
                        const newWidth = Math.max(
                          100,
                          Math.min(800, startWidth + deltaX),
                        );
                        const aspectRatio = startHeight / startWidth;
                        const newHeight = newWidth * aspectRatio;

                        imgElement.style.width = `${newWidth}px`;
                        imgElement.style.height = `${newHeight}px`;
                        imgElement.style.display = "inline-block";
                        imgElement.style.maxWidth = "100%";
                      };

                      const onPointerUp = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.removeEventListener(
                          "pointermove",
                          onPointerMove,
                        );
                        document.removeEventListener("pointerup", onPointerUp);

                        // Trigger reflow after resize
                        editables.forEach((el) => {
                          void el.offsetHeight;
                        });

                        // Handle page overflow after resize
                        handlePageOverflow();
                      };

                      imgElement.addEventListener(
                        "pointerdown",
                        (e) => {
                          if (!editing) return;

                          e.preventDefault();
                          e.stopPropagation();

                          startX = e.clientX;
                          startY = e.clientY;
                          startWidth =
                            imgElement.offsetWidth ||
                            parseInt(imgElement.style.width) ||
                            imgElement.width;
                          startHeight =
                            imgElement.offsetHeight ||
                            parseInt(imgElement.style.height) ||
                            imgElement.height;

                          document.addEventListener(
                            "pointermove",
                            onPointerMove,
                          );
                          document.addEventListener("pointerup", onPointerUp);
                        },
                        { once: false, passive: false },
                      );
                    }
                  }

                  // Also call attachImageResizeHandler to ensure all images have handlers
                  attachImageResizeHandler();

                  handlePageOverflow();
                }, 300);
              }, 50);
            }, { once: true });
          };

          if (clipboardFile) {
            reader.readAsDataURL(clipboardFile);
          }
        }
      }

      // If it's not an image, allow default paste behavior for text
      if (!hasImage) {
        // Allow default paste for text content
        setTimeout(() => {
          handlePageOverflow();
        }, 50);
      }
    };

    editables.forEach((el) => {
      el.contentEditable = editing;
      el.style.outline = editing ? "1px dashed #4f46e5" : "none";

      if (editing) {
        el.addEventListener("input", handleInput);
        el.addEventListener("paste", handlePaste);
        attachImageResizeHandler();
      } else {
        el.removeEventListener("input", handleInput);
        el.removeEventListener("paste", handlePaste);
      }
    });

    // Table cell'larini ham contentEditable qilish
    const tableCells = document.querySelectorAll(".editable-table td");
    tableCells.forEach((cell) => {
      cell.contentEditable = editing;
      if (editing) {
        cell.style.outline = "1px dashed #4f46e5";

        // Table cells'ga paste handler qo'shish
        const handleTableCellPaste = (e) => {
          const items = (e.clipboardData || e.originalEvent.clipboardData)
            .items;
          let hasImage = false;

          for (let item of items) {
            if (item.kind === "file" && item.type.indexOf("image") !== -1) {
              hasImage = true;
              e.preventDefault();

              const blob = item.getAsFile();
              const reader = new FileReader();

              reader.onload = (event) => {
                const imgElement = document.createElement("img");
                imgElement.src = event.target.result; // Base64 sifatida saqlangan
                imgElement.style.maxWidth = "100%";
                imgElement.style.height = "auto";
                imgElement.style.display = "block";
                imgElement.style.margin = "5px 0";

                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  range.insertNode(imgElement);
                  range.setStartAfter(imgElement);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              };

              reader.readAsDataURL(blob);
            }
          }

          if (!hasImage) {
            setTimeout(() => {
              handlePageOverflow();
            }, 50);
          }
        };

        cell.addEventListener("paste", handleTableCellPaste);
      } else {
        cell.style.outline = "none";
        // Paste listeners'ni olib tashlash
        const allCells = document.querySelectorAll(".editable-table td");
        allCells.forEach((c) => {
          c.removeEventListener("paste", c._pasteHandler);
        });
      }
    });

    return () => {
      editables.forEach((el) => {
        el.removeEventListener("input", handleInput);
        el.removeEventListener("paste", handlePaste);
      });
    };
  }, [editing, pages1]);

  useEffect(() => {
    const allPageContent = document.querySelectorAll(".page-content");
    const strongElements = document.querySelectorAll(".page-content strong");

    strongElements.forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (
        text === "Yuqori" ||
        text === "Past" ||
        text === "O‘rta" ||
        text === "Ma’lumot uchun" ||
        text === "Xavflilik darajasi:" ||
        text.includes(".apk") ||
        text.includes(".ipa") ||
        text.includes("[android:usesCleartextTraffic=false]") ||
        text.includes("CWE") ||
        text.includes("MASWE")
      ) {
        const tdParent = el.closest("td");
        if (!tdParent) {
          el.classList.add("strongstyle");
        }
      } else if (
        text === "Ekspluatatsiya oqibatlari" ||
        text === "Tavsiyalar"
      ) {
        if (!el.closest("td")) {
          el.classList.add("teststrong");
        }
      }
    });

    allPageContent.forEach((page) => {
      // console.log(page.offsetHeight);
    });
  }, [pages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editing) return;

      if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (["e", "l", "r", "j"].includes(key)) e.preventDefault();

        switch (key) {
          case "e":
            document.execCommand("justifyCenter");
            break;
          case "l":
            document.execCommand("justifyLeft");
            break;
          case "r":
            document.execCommand("justifyRight");
            break;
          case "j":
            // Apply justify alignment using both execCommand and CSS for better compatibility
            document.execCommand("justifyFull");
            // Also apply CSS text-align for better cross-browser support
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const container = range.commonAncestorContainer;
              const block =
                container.nodeType === Node.TEXT_NODE
                  ? container.parentElement?.closest(
                    "p, div, li, h1, h2, h3, h4, h5, h6",
                  )
                  : container.closest("p, div, li, h1, h2, h3, h4, h5, h6");

              if (block) {
                block.style.textAlign = "justify";
              }
            }
            break;
        }
      }

      // Handle Shift+Backspace key - move content back to previous page
      if (e.shiftKey && e.key === "Backspace") {
        e.preventDefault();

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const currentPageContent =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
              ? range.commonAncestorContainer.parentElement.closest(
                ".page-content",
              )
              : range.commonAncestorContainer.closest(".page-content");

          if (currentPageContent) {
            // Find current and previous page
            const currentPage = currentPageContent.closest(".a4");
            const allPages = Array.from(document.querySelectorAll(".a4"));
            const currentPageIndex = allPages.indexOf(currentPage);

            if (currentPageIndex > 0) {
              const prevPage = allPages[currentPageIndex - 1];
              const prevPageContent = prevPage.querySelector(".page-content");

              if (prevPageContent && currentPageContent.children.length > 0) {
                // Get first child from current page
                const firstChild = currentPageContent.firstChild;
                if (firstChild) {
                  // Move it to previous page's end
                  const clonedChild = firstChild.cloneNode(true);
                  prevPageContent.appendChild(clonedChild);

                  // Remove from current page
                  firstChild.remove();
                }
              }
            }
          }
        }
      }

      // Handle Enter key for page overflow
      // Textarea va input elementlarida Enter ishlashiga ruxsat berish
      if (e.key === "Enter") {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === "textarea" || tagName === "input") {
          return; // Textarea va input uchun default behavior
        }
        e.preventDefault();
        // Insert line break manually
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const br = document.createElement("br");
          range.insertNode(br);
          range.setStartAfter(br);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        // Check for overflow after Enter
        setTimeout(() => {
          handlePageOverflow();
        }, 10);
      }

      if (e.key === "Tab") {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === "textarea" || tagName === "input") {
          return; // Textarea va input uchun default behavior
        }
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const tabNode = document.createTextNode(
          "\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0",
        );
        range.insertNode(tabNode);
        range.setStartAfter(tabNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editing]);

  const paginateHtml = (html) => {
    const measure = document.createElement("div");
    measure.style.width = "794px";
    measure.style.padding = "40px";
    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.style.fontSize = "14px";
    measure.style.lineHeight = "1.6";
    document.body.appendChild(measure);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    const blocks = Array.from(wrapper.childNodes);
    const pagesResult = [];
    let currentPage = document.createElement("div");

    blocks.forEach((block) => {
      currentPage.appendChild(block.cloneNode(true));
      measure.innerHTML = currentPage.innerHTML;

      if (measure.scrollHeight > 950) {
        const lastChild = currentPage.lastChild;
        if (lastChild) {
          currentPage.removeChild(lastChild);

          pagesResult.push(currentPage.innerHTML);

          currentPage = document.createElement("div");
          currentPage.appendChild(lastChild.cloneNode(true));
        }
      }
    });

    if (currentPage.innerHTML.trim()) {
      pagesResult.push(currentPage.innerHTML);
    }

    document.body.removeChild(measure);
    setPages(pagesResult);
  };

  const saveAllPages = () => {
    const updated = pageRefs.current.map((el) => el?.innerHTML || "");
    setPages(updated);
    setEditing(false);
  };

  const getExpertById = async () => {
    // console.log(id);
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_GET_ID, { 1: id });
      // console.log(res[1])
      if (res.status === METHOD.OK) {
        let fallbackRiskTable = null;
        setContractDate(formatDate(res[1]?.[2][1]));
        setHtmlContent(res[1]?.[8]);
        setContractName(res[1]?.[10]);
        setOrgTypeName(res[1]?.[1][6]);
        setOrgName(res[1]?.[1][0]);
        setAppName(res[1]?.[1][3]);
        setExpertize(res[1]?.[1]);
        const raw = res[1]?.[13];
        const rawFiles = res[1]?.[15];

        // 15-field: [{1: fileId, 2: size}, ...] ko'rinishidagi mapping
        const normalizeFilesMeta = (rf) => {
          const list = Array.isArray(rf) ? rf : rf ? [rf] : [];
          const out = {};
          list
            .flat()
            .filter(Boolean)
            .forEach((it) => {
              const fileId = it?.[1] ?? it?.["1"];
              const size = it?.[2] ?? it?.["2"];
              if (!fileId) return;
              const fid = String(fileId);
              const sz = Number(size);
              out[fid] = Number.isFinite(sz) ? sz : undefined;
              // `files/` prefiksi bilan ham saqlab qo'yamiz
              out[`files/${fid.replace(/^files\//i, "")}`] = Number.isFinite(sz)
                ? sz
                : undefined;
            });
          return out;
        };

        setUploadedFilesMeta(normalizeFilesMeta(rawFiles));
        const filesList = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];
        setUploadedFilesList(filesList);

        const apkName = res[1]?.[8][0];
        const match = apkName.match(/[a-zA-Z0-9\.\-_]+\.apk/i);
        const apkName1 = match ? match[0] : null;
        setApkFileName(apkName1);

        const ipaMatch = apkName.match(/[a-zA-Z0-9\.\-_]+\.ipa/i);
        const ipaFile = ipaMatch ? ipaMatch[0] : null;
        setIpaFileName(ipaFile);

        // console.log("Topilgan fayl:", apkName1);

        // Field 8 ning 0-indexidan table ma'lumotlarini va qolganini paged sifatida olish
        const field8Data = res[1]?.[8] || [];
        let vulnData = field8Data;

        // Agar field 8 array bo'lsa va 0-index string bo'lsa, bu table va links ma'lumotlari
        if (
          Array.isArray(field8Data) &&
          field8Data.length > 0 &&
          typeof field8Data[0] === "string"
        ) {
          try {
            const dataFromField8 = JSON.parse(field8Data[0]);
            // Yangi format: { tables: {...}, objectLinks: [...] }
            if (dataFromField8.tables && dataFromField8.objectLinks) {
              setTableData(dataFromField8.tables);
              setObjectLinks(dataFromField8.objectLinks);
              setObjectLinksText(dataFromField8.objectLinks.join("\n"));
              if (Array.isArray(dataFromField8.systemAccountsRows)) {
                setSystemAccountsRows(dataFromField8.systemAccountsRows);
              }
              if (Array.isArray(dataFromField8.riskTable)) {
                fallbackRiskTable = dataFromField8.riskTable;
              }
            } else {
              // Eski format: faqat tables
              setTableData(dataFromField8);
            }
            vulnData = field8Data.slice(1); // Table ma'lumotlaridan keyingi qolganlarni ol
          } catch (err) {
            vulnData = field8Data; // Agar parse qilsa xatolik bo'lsa, dastlabkisini ishla
          }
        }

        // Res'dan kelayotgan HTML stringlarini flatten qilish, raqamlarni tartiblab va page-number olib tashlash
        let expTitleIndex = 1;
        const flatVulnData = Array.isArray(vulnData)
          ? vulnData
            .flat()
            .filter((item) => !item.includes("page-number"))
            .map((item) => {
              // exp-title ichidagi raqamni dinamik o'zgartirish
              if (item.includes("exp-title")) {
                return item.replace(/2\.2\.\d+/g, `2.2.${expTitleIndex++}`);
              }
              return item;
            })
          : [];
        setNewVuln(flatVulnData);

        const normalizeVulnField = (rf) => {
          if (!rf) return [];
          if (Array.isArray(rf)) {
            return rf
              .flat()
              .filter(Boolean)
              .map(({ a1, a2, a3, a4 }) => ({ a1, a2, a3, a4 }))
              .filter((x) => x.a1 != null && x.a3);
          }
          if (typeof rf === "object") {
            const one = { a1: rf.a1, a2: rf.a2, a3: rf.a3, a4: rf.a4 };
            return one.a1 != null && one.a3 ? [one] : [];
          }
          return [];
        };

        const fallbackList = Array.isArray(fallbackRiskTable)
          ? fallbackRiskTable
              .filter(Boolean)
              .map(({ a1, a2, a3, a4 }) => ({ a1, a2, a3, a4 }))
              .filter((x) => x.a1 != null && x.a3)
          : [];

        const highVuln1Raw = normalizeVulnField(raw);
        const highVuln1 =
          highVuln1Raw.length > 0
            ? highVuln1Raw
            : fallbackList.filter((x) => Number(x.a1) === 1);

        setHighVuln(highVuln1);

        const raw1 = res[1]?.[12];

        const mVRaw = normalizeVulnField(raw1);
        const mV =
          mVRaw.length > 0 ? mVRaw : fallbackList.filter((x) => Number(x.a1) === 2);
        setMediumVuln(mV);

        const raw2 = res[1]?.[11];

        const lVRaw = normalizeVulnField(raw2);
        const lV =
          lVRaw.length > 0 ? lVRaw : fallbackList.filter((x) => Number(x.a1) === 3);
        setLowVuln(lV);

        // console.log(res[1]?.[13]);
        setAllVuln([...highVuln1, ...mV, ...lV]);

        // Table ma'lumotlari field 8 ning 0-indexidan olingan
      } else if (res.status === METHOD.BAD_REQUEST) {
        toast.error("Ma'lumot topilmadi!");
      }
      // console.log(res);
    } catch (error) {
      console.log(error);
      console.log("Xatolik yuz berdi!");
    }
  };

  useEffect(() => {
    getExpertById();
    // console.log(highVuln);
  }, []);

  // objectLinksText dan objectLinks ga sync qilish
  useEffect(() => {
    if (!editing && objectLinksText) {
      const links = objectLinksText
        .split("\n")
        .map((link) => link.trim())
        .filter((link) => link.length > 0);
      setObjectLinks(links);
    }
  }, [editing, objectLinksText]);

  useEffect(() => {
    const pages = paginateSectionTableRows(sectionTableRowHtml);
    setSectionTablePages(pages);
  }, [sectionTableRowHtml]);

  // Table ma'lumotlarini DOM'ga qayta yuklash (rasmlar bilan)
  useEffect(() => {
    if (Object.keys(tableData).length > 0) {
      const tables = document.querySelectorAll("table.editable-table");

      tables.forEach((table, idx) => {
        const key = `table_${idx}`;
        if (tableData[key] && tableData[key].length > 0) {
          const tbody = table.querySelector("tbody");
          if (tbody) {
            // Faqat agar data bo'lsa barcha qatorlarni o'chirish va yangilash
            tbody.innerHTML = "";

            // Yangi rows'larni qo'shish
            tableData[key].forEach((rowData) => {
              const row = document.createElement("tr");
              rowData.forEach((cellData) => {
                const cell = document.createElement("td");

                // Agar cellData HTML bo'lsa (rasmlar bilan), innerHTML sifatida qo'shamiz
                if (cellData.includes("<img") || cellData.includes("<IMG")) {
                  cell.innerHTML = cellData;
                } else {
                  cell.innerText = cellData;
                }

                cell.contentEditable = editing;
                row.appendChild(cell);
              });
              tbody.appendChild(row);
            });
          }
        }
      });
    }
  }, [tableData, editing]);

  const renderPage = (html, index) => (
    <div
      key={index}
      className="page-container editable"
      contentEditable={editing}
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: html }}
      ref={(el) => (pageRefs.current[index] = el)}
    />
  );

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    const day = date.getDate();
    const monthNumber = date.getMonth() + 1;
    const year = date.getFullYear();

    let monthName = "";

    switch (monthNumber) {
      case 1:
        monthName = "yanvardagi";
        break;
      case 2:
        monthName = "fevraldagi";
        break;
      case 3:
        monthName = "martdagi";
        break;
      case 4:
        monthName = "apreldagi";
        break;
      case 5:
        monthName = "maydagi";
        break;
      case 6:
        monthName = "iyundagi";
        break;
      case 7:
        monthName = "iyuldagi";
        break;
      case 8:
        monthName = "avgustdagi";
        break;
      case 9:
        monthName = "sentabrdagi";
        break;
      case 10:
        monthName = "oktabrdagi";
        break;
      case 11:
        monthName = "noyabrdagi";
        break;
      case 12:
        monthName = "dekabrdagi";
        break;
      default:
        monthName = "";
    }

    return ` ${year}-yil ${day} ${monthName}`;
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const addVulnerabilityToPages = (docVulnHtml) => {
    setVulnerabilities((prev) => [...prev, docVulnHtml]);
  };

  const handleSaveDocFromModal = (docVuln) => {
    // console.log("Childdan keldi:", docVuln);
    generateVulnHtml(docVuln.vuln);
    const html = vulnerabilityTemplates[docVuln.type];
    // console.log("HTML:", html);

    addVulnerabilityToPages(html);
    handleSubmit(docVuln);
  };

  const insertAfterIndex = (array, index, newItem) => {
    if (index < 0 || index >= array.length) {
      return [...array, newItem];
    }

    return [...array.slice(0, index + 1), newItem, ...array.slice(index + 1)];
  };

  const stripHtml = (html = "") => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const riskRows = useMemo(() => {
    const items = [...(highVuln || []), ...(mediumVuln || []), ...(lowVuln || [])]
      .filter(Boolean)
      .map((v) => {
        const level = Number(v?.a1) || v?.a1;
        const countRaw = v?.a2 ?? 1;
        const count = Number(countRaw);
        const name = stripHtml(v?.a3 || "").trim();
        const resourceLabel = extractResourceHost(v?.a4 || "") || "Umumiy";
        return {
          type: "vuln",
          level,
          count: Number.isFinite(count) && count > 0 ? count : 1,
          name,
          resourceLabel,
        };
      })
      .filter((v) => v.name);

    // (resource -> level -> name) bo'yicha agregatsiya
    const byResource = new Map();
    for (const v of items) {
      if (!byResource.has(v.resourceLabel)) byResource.set(v.resourceLabel, new Map());
      const key = `${Number(v.level) || v.level}|||${v.name}`;
      const m = byResource.get(v.resourceLabel);
      const prev = m.get(key);
      m.set(key, prev ? { ...prev, count: prev.count + v.count } : v);
    }

    const resourceOrder = Array.isArray(objectLinks) ? objectLinks.map(extractResourceHost) : [];
    const resources = Array.from(byResource.keys()).sort((a, b) => {
      const ai = resourceOrder.indexOf(a);
      const bi = resourceOrder.indexOf(b);
      const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      if (aRank !== bRank) return aRank - bRank;
      return a.localeCompare(b, "uz");
    });

    const levelPriority = (lev) => (Number(lev) === 1 ? 0 : Number(lev) === 2 ? 1 : 2);

    const out = [];
    for (const r of resources) {
      const map = byResource.get(r);
      if (!map || map.size === 0) continue;
      out.push({ type: "resource", label: r });

      const grouped = Array.from(map.values());
      grouped.sort((x, y) => {
        const px = levelPriority(x.level);
        const py = levelPriority(y.level);
        if (px !== py) return px - py; // Yuqori -> O‘rta -> Past
        return (x.name || "").localeCompare(y.name || "", "uz");
      });

      for (const v of grouped) out.push(v);
    }

    return out;
  }, [highVuln, mediumVuln, lowVuln, objectLinks]);

  const { riskFirstPageRows, riskContinuationPages } = useMemo(() => {
    const first = takeRiskRows(riskRows, 0, 6);
    const cont = chunkRiskColumnPages(riskRows, first.nextIndex, 14, 14);
    return { riskFirstPageRows: first.page, riskContinuationPages: cont };
  }, [riskRows]);

  const tocVulnerabilityItems = useMemo(() => {
    const DETAIL_START_PAGE = 17;

    const titleToResource = new Map();
    (riskRows || [])
      .filter((r) => r?.type === "vuln")
      .forEach((r) => {
        if (!r?.name) return;
        if (!titleToResource.has(r.name)) titleToResource.set(r.name, r.resourceLabel || "Umumiy");
      });

    const seen = new Set();
    const entries = [];

    (pages3 || []).forEach((pageItems, pageIdx) => {
      (pageItems || []).forEach((html) => {
        if (!html || typeof html !== "string") return;
        if (!html.includes("system-subtitle")) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const el = doc.querySelector(".system-subtitle");
        const subtitleText = (el?.textContent || "").trim();
        if (!subtitleText) return;

        // faqat system-subtitle ichidagi matn: xohlasangiz prefiks raqamlarni olib tashlaymiz
        const title = subtitleText.replace(/^2\.2\.1\.\d+\.\s*/g, "").trim();
        if (!title || seen.has(title)) return;
        seen.add(title);

        const resourceLabel = titleToResource.get(title) || "Umumiy";
        const pageNum = DETAIL_START_PAGE + pageIdx;

        entries.push({
          title,
          resourceLabel,
          pageNum,
        });
      });
    });

    const orderHosts = (objectLinks || []).map(extractResourceHost);
    const resourceRank = (host) => {
      const h = extractResourceHost(host || "");
      const idx = orderHosts.indexOf(h);
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };

    // group by resource (risk table tartibiga yaqin bo'lishi uchun)
    const grouped = new Map();
    for (const e of entries) {
      const host = extractResourceHost(e.resourceLabel) || e.resourceLabel || "Umumiy";
      if (!grouped.has(host)) grouped.set(host, []);
      grouped.get(host).push(e);
    }

    const resources = Array.from(grouped.keys()).sort((a, b) => {
      const ar = resourceRank(a);
      const br = resourceRank(b);
      if (ar !== br) return ar - br;
      return a.localeCompare(b, "uz");
    });

    const out = [];
    for (const res of resources) {
      const items = grouped.get(res) || [];
      if (!items.length) continue;
      items.sort((a, b) => a.pageNum - b.pageNum || a.title.localeCompare(b.title, "uz"));
      out.push({ type: "subheader", title: `“${res}” veb-resursi` });
      for (const it of items) {
        out.push({
          type: "row",
          title: it.title,
          page: String(it.pageNum),
          large: it.title.length > 44,
        });
      }
    }

    return {
      items: out,
      section3Page: String(DETAIL_START_PAGE + (pages3?.length || 0)),
    };
  }, [riskRows, pages3, objectLinks]);

  const tocItems = useMemo(() => {
    const base = [
      {
        type: "section",
        page: "5",
        section: "BIRINCHI BO‘LIM.",
        head: "UMUMIY MA’LUMOTLAR",
      },
      { type: "row", title: "Atamalar va ta’riflar", page: "5" },
      { type: "row", title: "Ekspertiza o‘tkazish uchun asos", page: "6" },
      { type: "row", title: "Ekspertiza obyekti", page: "6" },
      { type: "row", title: "Ekspertiza o‘tkazish tartibi", page: "6" },
      {
        type: "row",
        title: "Ekspertiza yuzasidan qo‘shimcha ma’lumotlar",
        page: "8",
        large: true,
      },
      {
        type: "section",
        page: "10",
        section: "IKKINCHI BO‘LIM.",
        head: "EKSPERTIZA NATIJALARI",
      },
      {
        type: "row",
        title: "Ekspertiza natijalari to‘g‘risida umumlashtirilgan ma’lumot",
        page: "10",
        large: true,
      },
      {
        type: "row",
        title: "Ekspertiza natijalari bo‘yicha batafsil izoh",
        page: "14",
        large: true,
      },
    ];

    const tail = [
      {
        type: "section",
        page: tocVulnerabilityItems.section3Page,
        section: "UCHINCHI BO‘LIM.",
        head: "UMUMIY XULOSA",
      },
    ];

    return [...base, ...(tocVulnerabilityItems.items || []), ...tail];
  }, [tocVulnerabilityItems]);

  const tocItemHtml = useMemo(
    () => tocItems.map((item) => buildTocItemHtml(item)),
    [tocItems],
  );

  useEffect(() => {
    const pages = paginateTocItems(tocItemHtml);
    setTocPages(pages);
  }, [tocItemHtml]);

  const renderRiskTableBody = (pageRows, keyPrefix) => {
    const rows = Array.isArray(pageRows) ? pageRows : [];
    const meta = computeRiskLevelRowspanMeta(rows);

    return rows.map((row, idx) => {
      if (row?.type === "resource") {
        return (
          <tr key={`${keyPrefix}-r-${idx}`} className="risk-resource">
            <td colSpan={3}>“{row.label}” resursi</td>
          </tr>
        );
      }

      const m = meta[idx] || { showLevel: false, rowSpan: 1 };

      return (
        <tr key={`${keyPrefix}-v-${idx}`} className={riskRowClass(row?.level)}>
          {m.showLevel && (
            <td className="risk-level" rowSpan={m.rowSpan}>
              {riskLevelText(row?.level)}
            </td>
          )}
          <td className="risk-name">{row?.name}</td>
          <td className="risk-count">{row?.count}</td>
        </tr>
      );
    });
  };

  // Textni gaplar bo'yicha inline span larga ajratadi (blok emas)
  const splitToInlineSpans = (text) => {
    if (!text) return text;
    // Nuqta bilan tugagan gaplarni ajratish
    const sentences = text.split(/(?<=\.)\s+/).filter((s) => s.trim());
    if (sentences.length <= 1) {
      return text;
    }
    return sentences
      .map((sentence) => `<span>${sentence.trim()}</span>`)
      .join(" ");
  };

  const generateVulnHtml = (vulnData) => {
    const level = vulnData?.[1]?.[0];
    const title = stripHtml(vulnData?.[1]?.[1]);
    const result = stripHtml(vulnData?.[1]?.[2]);
    const desc = stripHtml(vulnData?.[1]?.[3]);
    const recommendation = stripHtml(vulnData?.[1]?.[4]);

    const levelText = level === 1 ? "Yuqori" : level === 2 ? "O‘rta" : "Past";

    let newInnerHtml = "";
    if (newVuln.length == 0) {
      newInnerHtml = `
    <div class="system-bar-title">2.2. Ekspertiza natijalari bo‘yicha batafsil izoh</div>
    <div class="system-subhead system-highlight">2.2.1. “${appName}” axborot tizimi</div>
    <div class="system-subtitle">2.2.1.${vulnCounter}. ${title}</div>
    <p class="system-paragraph"><b>Xavflilik darajasi:</b> ${levelText}.</p>
    <p class="system-paragraph">${splitToInlineSpans(result)}</p>
    <div class="system-subtitle">Ekspluatatsiya oqibatlari</div>
    <p class="system-paragraph">${splitToInlineSpans(desc)}</p>
    <div class="system-subtitle">Tavsiyalar</div>
    <p class="system-paragraph">${splitToInlineSpans(recommendation)}</p>
  `;
    } else {
      newInnerHtml = `
    <div class="system-subtitle">2.2.1.${vulnCounter}. ${title}</div>
    <p class="system-paragraph"><b>Xavflilik darajasi:</b> ${levelText}.</p>
    <p class="system-paragraph">${splitToInlineSpans(result)}</p>
    <div class="system-subtitle">Ekspluatatsiya oqibatlari</div>
    <p class="system-paragraph">${splitToInlineSpans(desc)}</p>
    <div class="system-subtitle">Tavsiyalar</div>
    <p class="system-paragraph">${splitToInlineSpans(recommendation)}</p>
  `;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(newInnerHtml, "text/html");

    const blocks = Array.from(doc.body.children).map((el) => el.outerHTML);

    setNewVuln((prev) => [...prev, ...blocks]);
    vulnCounter += 1;

    // console.log(newVuln);
    setHtmlContent((prev) => {
      const updated = [...prev];

      const parser = new DOMParser();
      const doc = parser.parseFromString(updated[startIndex], "text/html");

      const pageContent = doc.querySelector(".page-content");
      if (pageContent) {
        pageContent.insertAdjacentHTML("beforeend", newInnerHtml);
        updated[startIndex] = doc.body.innerHTML;
      }

      // console.log(updated);
      const a4 = document.querySelectorAll(".page-content");
      const a4Array = Array.from(updated).map((el) => el.innerHTML);
      // console.log(a4Array);

      // setHtmlContent(updated);

      return updated;
    });
  };

  const handleSubmit = async (docVuln) => {
    try {
      console.log(docVuln);
      const level = docVuln?.vuln?.[1]?.[0];
      if (!level) return;

      const fieldMap = {
        1: 13,
        2: 12,
        3: 11,
      };

      const field = fieldMap[level];
      if (!field) return;

      const payload = {
        19: id,
        11: [
          {
            a1: docVuln?.vulnCount,
            a2: level,
            a3: docVuln?.vuln?.[1]?.[1],
            // a4: docVuln?.resource || "",
          },
        ],
      };

      console.log(payload)

      // console.log(docVuln);
      const newItem = payload?.[field]?.[0];
      if (newItem) {
        if (Number(level) === 1) setHighVuln((prev) => [...(prev || []), newItem]);
        else if (Number(level) === 2)
          setMediumVuln((prev) => [...(prev || []), newItem]);
        else if (Number(level) === 3) setLowVuln((prev) => [...(prev || []), newItem]);

        setAllVuln((prev) => [...(prev || []), newItem]);
      }
      setPlatform("umumiy");
      setVulnUm((prev) => [...prev, payload]);

      // return;
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, payload);
      console.log(res)

      // if (res.status == METHOD.OK) {
      //   if (field === 11) {
      //   }
      // }

      // console.log("Yuborilgan payload:", payload);
      // console.log("Response:", res);
    } catch (error) {
      console.error(error);
    }
  };

  const paginateContent = (items) => {
    // Agar items array bo'lmasa, string bo'lsa uni array ga o'gir
    const itemsArray = Array.isArray(items)
      ? items
      : typeof items === "string"
        ? [items]
        : [];

    if (!itemsArray.length) return [];

    const pages = [];
    let currentPage = [];

    const tempDiv = document.createElement("div");
    tempDiv.style.width = "385px";
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    document.body.appendChild(tempDiv);

    itemsArray.forEach((item) => {
      if (!item) return;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = item;
      tempDiv.appendChild(wrapper);

      if (tempDiv.scrollHeight > 1080) {
        if (currentPage.length) pages.push(currentPage);
        currentPage = [item];
        tempDiv.innerHTML = item;
      } else {
        currentPage.push(item);
      }
    });

    if (currentPage.length) pages.push(currentPage);
    document.body.removeChild(tempDiv);
    return pages;
  };

  useEffect(() => {
    if (newVuln?.length) {
      const result = paginateContent(newVuln);
      setPages3(result);
    }
  }, [newVuln]);

  const handleInput = (pageContent) => {
    if (!pageContent || !pageContent.children) return;

    const blocks = Array.from(pageContent.children).map(
      (child) => child.outerHTML,
    );

    const paged = paginateContent(blocks);
    // console.log("hello")
    setPages1(paged);
  };

  const makeImagesResizable = (container) => {
    const imgs = container.querySelectorAll(".text img");

    imgs.forEach((img) => {
      // agar allaqachon event qo‘shilgan bo‘lsa, qaytadan qo‘shmaslik
      if (img.dataset.resizable) return;
      img.dataset.resizable = "true";

      img.style.userSelect = "none";
      img.style.cursor = "nwse-resize";

      let startX, startY, startWidth, startHeight;

      const onPointerMove = (e) => {
        const newWidth = startWidth + (e.clientX - startX);
        const newHeight = startHeight + (e.clientY - startY);
        img.style.width = `${Math.max(50, newWidth)}px`;
        img.style.height = `${Math.max(50, newHeight)}px`;
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);

        // resize qilinganidan keyin pagination yangilash
        const pageContent = img.closest(".page-content");
        if (pageContent) handleInput({ currentTarget: pageContent });
      };

      img.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      });
    });
  };

  useEffect(() => {
    const editables = document.querySelectorAll(".page-content");

    editables.forEach((container) => {
      // dastlabki rasm eventlari
      makeImagesResizable(container);

      const observer = new MutationObserver(() => {
        makeImagesResizable(container); // yangi rasm qo‘shilganda ham event qo‘shiladi
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    });
  }, [pages1, editing, newVuln, htmlContent]);

  const saveAllChanges = async () => {
    const allPages = document.querySelectorAll(".new-content");

    let allBlocks = [];

    allPages.forEach((page) => {
      Array.from(page.children).forEach((child) => {
        // Agar child o'zi div bo'lsa va uning ichida yana div'lar bo'lsa,
        // faqat ichki kontentni olish - bu div'lar takrorlanib qolmasligi uchun
        if (child.tagName === "DIV") {
          // Child'ning ichida yana div'lar borligini tekshirish
          const hasNestedDivs = child.querySelector("div") !== null;

          // Muhim class'larni tekshirish (text, exp-title, exp-d, va hokazo)
          const hasImportantClass =
            child.classList.contains("text") ||
            child.classList.contains("exp-title") ||
            child.classList.contains("exp-d") ||
            child.classList.contains("title");

          if (hasNestedDivs && !hasImportantClass) {
            // Agar ichida div'lar bo'lsa va muhim class bo'lmasa, faqat innerHTML olish
            // Bu wrapper div'ni olib tashlaydi (React tomonidan qo'shilgan wrapper div)
            allBlocks.push(child.innerHTML);
          } else {
            // Agar ichida div'lar bo'lmasa yoki muhim class bo'lsa, outerHTML ishlatish
            allBlocks.push(child.outerHTML);
          }
        } else {
          // Boshqa elementlar uchun outerHTML ishlatish
          allBlocks.push(child.outerHTML);
        }
      });
    });

    console.log(allBlocks);

    // pagination qayta hisoblanadi
    const paged = paginateContent(allBlocks);

    // Table ma'lumotlarini o'qish (rasmlar bilan base64 da)
    const extractTableData = () => {
      // Ikkala jadvalni ham topish uchun umumiy klassni ishlatamiz
      const tables = document.querySelectorAll("table.expert-table");
      const data = {};

      console.log("Jami topilgan jadvallar:", tables.length);

      tables.forEach((table, idx) => {
        // Agar jadvalda tbody bo'lsa, uning qatorlarini olamiz
        const rows = table.querySelectorAll("tbody tr");
        const tableContent = [];

        rows.forEach((row, rowIdx) => {
          const cells = row.querySelectorAll("td");
          // td ichidagi matnni va rasmlarni saqlaymiz
          const rowData = Array.from(cells).map((cell) => {
            const cellText = cell.innerText.trim();
            const images = cell.querySelectorAll("img");

            // Agar katakda rasm bo'lsa, HTML sifatida saqlaymiz (base64 bilan)
            if (images.length > 0) {
              return cell.innerHTML;
            }

            return cellText;
          });
          tableContent.push(rowData);
        });

        if (tableContent.length > 0) {
          // Har bir jadvalni o'z indeksi bilan saqlaymiz
          data[`table_${idx}`] = tableContent;
        }
      });

      return data;
    };

    const tables = extractTableData();

    // ObjectLinks ni parse qilish
    const currentLinks = objectLinksText
      .split("\n")
      .map((link) => link.trim())
      .filter((link) => link.length > 0);
    setObjectLinks(currentLinks);

    const riskTableToSave = (riskRows || [])
      .filter((r) => r?.type === "vuln")
      .map((r) => ({
        a1: r.level,
        a2: r.count,
        a3: r.name,
        a4: r.resourceLabel,
      }));

    const tablesAndLinksJson = JSON.stringify({
      tables: tables,
      objectLinks: currentLinks,
      systemAccountsRows,
      riskTable: riskTableToSave,
    });

    const apkName = tablesAndLinksJson;
    const match = apkName.match(/[a-zA-Z0-9\.\-_]+\.apk/i);
    const apkName1 = match ? match[0] : null;
    setApkFileName(apkName1);

    const ipaMatch = apkName.match(/[a-zA-Z0-9\.\-_]+\.ipa/i);
    const ipaFile = ipaMatch ? ipaMatch[0] : null;
    setIpaFileName(ipaFile);

    const field8Data = [tablesAndLinksJson, ...paged];

    console.log("Saving field8Data:", field8Data);

    const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
      19: id,
      8: field8Data,
    });
    // console.log(res);

    setPages1(paged);
    setTableData(tables);
    setEditing(false); // edit rejimdan chiqadi

    toast.success("Barcha o‘zgarishlar saqlandi");
  };


  const handlePasteImage = async (file, imgElement) => {
    try {
      if (!file) return null;

      
      const safeType = file.type || "image/png";
      const extFromType =
        safeType.includes("png")
          ? "png"
          : safeType.includes("jpeg") || safeType.includes("jpg")
            ? "jpg"
            : safeType.includes("webp")
              ? "webp"
              : "png";

      const hasExt = typeof file.name === "string" && file.name.includes(".");
      const safeName = hasExt ? file.name : `paste-${Date.now()}.${extFromType}`;
      const uploadFile =
        file instanceof File ? new File([file], safeName, { type: safeType }) : file;

      const imageRes = await uploadFileViaRpc(stRef, uploadFile, id, (p) => {
        if (imgElement) imgElement.dataset.uploadProgress = String(p);
      });


      console.log(imageRes)

      const fileId = imageRes?.fileId || imageRes?.result?.fileId;
      if (fileId && imgElement) {
        imgElement.dataset.fileId = fileId;
        imgElement.dataset.uploaded = "true";
      }

      if (fileId && imgElement) {
        const srcUrl = await downloadFileAll(fileId, imageRes?.size);
        if (srcUrl) imgElement.src = srcUrl;
      }

      // Server 15-maydonni bitta obyekt sifatida kutadi: { 1: fileId, 2: fileSize }
      setUploadedFilesList((prev) => [...prev, { 1: fileId, 2: imageRes?.size }]);
      setUploadedFilesMeta((prev) => ({
        ...prev,
        [String(fileId)]: imageRes?.size,
        [`files/${String(fileId).replace(/^files\//i, "")}`]: imageRes?.size,
      }));
      const updateRes = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: id,
        15: { 1: fileId, 2: imageRes?.size },
      });
      console.log(updateRes);
      return fileId || null;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const downloadFileAll = async (id, size) => {
    if (!id) return null;
    const fid = String(id).replace(/^files\//i, "");
    const cacheKey = `files/${fid}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached && cached.startsWith("blob:")) return cached;

    const safeSize = Number(size);
    const blob = await downloadFileViaRpcNew(
      stRef,
      fid,
      fid,
      Number.isFinite(safeSize) ? safeSize : undefined,
      () => {},
    );
    const url = URL.createObjectURL(blob);
    // localStorage.setItem(cacheKey, url);
    return url;
  };

  // ORDER_GET_ID dan kelgan 15-field bo'yicha rasmlarni URL qilib qo'yish
  useEffect(() => {
    if (editing) return;
    const meta = uploadedFilesMeta || {};
    const keys = Object.keys(meta);
    if (!keys.length) return;

    let cancelled = false;

    const run = async () => {
      const imgs = Array.from(
        document.querySelectorAll('.page-content img[data-file-id]'),
      );
      for (const img of imgs) {
        console.log(img)
        if (cancelled) return;
        if (!img) continue;
        if (img.dataset.srcResolved === "true") continue;

        const dfidRaw = img.getAttribute("data-file-id") || img.dataset.fileId || "";
        if (!dfidRaw) continue;

        const dfid = dfidRaw.toString().trim();
        const fid = dfid.replace(/^files\//i, "");

        const size = meta[dfid] ?? meta[fid] ?? meta[`files/${fid}`];

        try {
          console.log(fid, size)
          const url = await downloadFileAll(fid, size);
          if (cancelled) return;
          console.log(url)
          if (url) {
            img.src = url;
            img.dataset.srcResolved = "true";
          }
        } catch (e) {
          // ignore single image failure
          console.log(e);
        }
      }
    };

    // DOM render bo'lishi uchun microtask
    Promise.resolve().then(run);
    return () => {
      cancelled = true;
    };
  }, [editing, uploadedFilesMeta, htmlContent, pages3]);


  const addNewTr = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), role: "", login: "", password: "" },
    ]);
  };

  const currentPages = pages3;
  return (
    <>
      <ExpertizeModal
        open={modalOpen}
        onClose={closeModal}
        item={expertize}
        itemId={id}
        onSaveDoc={handleSaveDocFromModal}
        resourceOptions={objectLinks}
      />

      <button
        onClick={saveAllChanges}
        className="fixed bottom-10 z-50 right-10 shadow-lg flex justify-center items-center w-[60px] h-[60px] bg-blue-500 text-white text-3xl  rounded-full cursor-pointer hover:bg-blue-600"
      >
        <iconify-icon icon="material-symbols:save"></iconify-icon>
      </button>

      <div className="word-container dark:text-[#333] relative " ref={printRef}>
        <div className="flex justify-end mb-4 gap-2 print-btns sticky right-9 top-[80px]">
          <button
            className="bg-blue-600 hvoer:bg-blue-700 text-white px-4 py-2 rounded mt-4"
            onClick={() => openModal(expertize)}
          >
            Zaiflik qo'shish
          </button>
          <button
            onClick={handlePrint}
            className={`mt-4 px-4 py-2 rounded text-white  items-end flex gap-2 
    ${loading ? "" : "bg-blue-600 hover:bg-blue-700"}
  `}
          >
            <iconify-icon
              icon="pepicons-print:printer"
              width="1.2em"
              height="1.2em"
            ></iconify-icon>
            <span> Hisobot </span>
          </button>

          <div
            className="edit-btn-global"
            onClick={() => {
              if (editing) {
                saveAllChanges();
              } else {
                setEditing(true);
              }
            }}
          >
            {editing ? (
              <div className="cursor-pointer change-btn">
                <div className="bg-green-500 hover:bg-green-600">
                  <FaSave />
                  <span>Saqlash </span>
                </div>
              </div>
            ) : (
              <div className="change-btn flex gap-2 cursor-pointer">
                <div className="bg-blue-600 hover:bg-blue-700">
                  <FaPen /> <span>Tahrirlash</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="a4 first-a4 system system-first">
          <div className="page-content">
            <h2
              className={`application-name system ${appName.length > 20 ? "mb-[50px]" : "mt-[50px]"}`}
            >
              “{appName}” axborot tizimi{" "}
            </h2>
          </div>
        </div>
        {tocPages.map((pageItems, pageIndex) => (
          <div
            key={`toc-${pageIndex}`}
            className={`a4 ${pageIndex % 2 === 0 ? "mundarija1 system-m1" : "mundarija2 system-m2"}`}
          >
            <div className="page-content top editable">
              <div
                className={`mundarija-content mundarija-content-system ${pageIndex === 0 ? "first" : ""}`}
                dangerouslySetInnerHTML={{ __html: pageItems.join("") }}
              />
            </div>
          </div>
        ))}
        <div className="a4 system-c system-text-page">
          {0 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div className="page-content editable">
            <div className="system-section-header">
              <div className="system-section-title">BIRINCHI BO‘LIM.</div>
              <div className="system-section-subtitle">UMUMIY MA’LUMOTLAR</div>
            </div>
            <div className="system-bar-title">1.1. Atamalar va ta’riflar</div>
            <div className="system-two-col">
              <div className="system-col">
                {section1Left.map((item) => (
                  <p className="system-paragraph" key={item.term}>
                    <span className="system-term">{item.term}</span> —{" "}
                    {item.text}
                  </p>
                ))}
              </div>
              <div className="system-col">
                {section1Right.map((item) => (
                  <p className="system-paragraph" key={item.term}>
                    <span className="system-term">{item.term}</span> —{" "}
                    {item.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div
            className="page-number flex justify-center mt-auto text-white items-center"
            style={{ bottom: "40px" }}
          >
            <span className="text-white max-w-[60%] mt-[20px]">
              {appName} | 5
            </span>
          </div>
        </div>
        <div className="a4 system-c system-text-page">
          {1 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div className="page-content editable">
            <div className="system-two-col">
              <div className="system-col">
                <p className="system-paragraph">{htmlInjectionContinuation}</p>
                {section2LeftTerms.map((item) => (
                  <p className="system-paragraph" key={item.term}>
                    <span className="system-term">{item.term}</span> —{" "}
                    {item.text}
                  </p>
                ))}
                <div className="system-bar-title">
                  1.2. Ekspertiza o‘tkazish uchun asos
                </div>
                <p className="system-paragraph">"Kiberxavfsizlik markazi" davlat unitar korxonasi va "{orgName}" {orgTypeName} o'rtasida tuzilgan {contractDate} <b>"{appName}"</b> axborot tizimini kiberxavfsizlik talablariga muvofiqligi yuzasidan ekspertizadan o'tkazish to'g'risidagi <b>"{contractName}"</b>-son shartnoma.</p>
              </div>
              <div className="system-col">
                <div className="system-bar-title">1.3. Ekspertiza obyekti</div>
                {editing ? (
                  <div className="system-paragraph">
                    <label className="block text-sm text-gray-500 mb-1">
                      Linklar (har bir qatorda bitta):
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded p-2 min-h-[100px]"
                      value={objectLinksText}
                      onChange={(e) => setObjectLinksText(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                ) : objectLinks.length === 1 ? (
                  <p className="system-paragraph">
                    <b>"{objectLinks[0]}"</b> URL manzilida joylashgan "{appName}" axborot tizimi.
                  </p>
                ) : (
                  <>
                <p className="system-paragraph">
                  “{appName}” axborot tizimining quyidagi
                  resurslari:
                </p>
                <ul className="system-list">
                  {objectLinks.map((link) => (
                    <li key={link}>“{link}”;</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="system-bar-title">
                  1.4. Ekspertiza o‘tkazish tartibi
                </div>
                <p className="system-paragraph">{section2ProcessIntro}</p>
                {section2ProcessItems.map((item) => (
                  <p className="system-paragraph" key={item.term}>
                    <span className="system-term">{item.term}</span> –{" "}
                    {item.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div
            className="page-number flex justify-center mt-auto text-white items-center"
            style={{ bottom: "40px" }}
          >
            <span className="text-white max-w-[60%] mt-[20px]">
              {appName} | 6
            </span>
          </div>
        </div>
        <div className="a4 system-c system-text-page">
          {2 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div className="page-content editable">
            <div className="system-two-col">
              <div className="system-col">
                <p className="system-paragraph">{whiteBoxContinuation}</p>
                <p className="system-paragraph">{section3Intro}</p>
                <ul className="system-list">
                  {section3BulletsLeft.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="system-col">
                <ul className="system-list">
                  {section3BulletsRight.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="system-paragraph">{section3TableIntro}</p>
            <div className="system-table-label">1-jadval</div>
            <table className="system-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>T/r</th>
                  <th>Tadbir nomi</th>
                </tr>
              </thead>
              <tbody
                dangerouslySetInnerHTML={{
                  __html: (sectionTablePages[0] || []).join(""),
                }}
              />
            </table>
          </div>
          <div
            className="page-number flex justify-center mt-auto text-white items-center"
            style={{ bottom: "40px" }}
          >
            <span className="text-white max-w-[60%] mt-[20px]">
              {appName} | 7
            </span>
          </div>
        </div>

        {sectionTablePages.slice(1).map((rows, pageIndex) => (
          <div key={`section-table-${pageIndex}`} className="a4 system-c system-text-page">
            {(pageIndex + 1) % 2 === 0 ? (
              <>
                <img
                  className="system-top-img w-full min-w-full"
                  src="/assets/system/ax-tops.png"
                  alt=""
                />
                <img
                  className="system-bottom-img w-full min-w-full"
                  src="/assets/system/ax-bottoms.jpg"
                  alt=""
                />
              </>
            ) : (
              <>
                <img
                  className="system-top-img w-full min-w-full"
                  src="/assets/system/ax-top.png"
                  alt=""
                />
                <img
                  className="system-bottom-img w-full min-w-full"
                  src="/assets/system/ax-bottom.jpg"
                  alt=""
                />
              </>
            )}
            <div className="page-content editable">
              <div className="system-table-label">1-jadval</div>
              <table className="system-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>T/r</th>
                    <th>Tadbir nomi</th>
                  </tr>
                </thead>
                <tbody dangerouslySetInnerHTML={{ __html: rows.join("") }} />
              </table>
            </div>
            <div
              className="page-number flex justify-center mt-auto text-white items-center"
              style={{ bottom: "40px" }}
            >
              <span className="text-white max-w-[60%] mt-[20px]">
                {appName}  | {7 + pageIndex + 1}
              </span>
            </div>
          </div>
        ))}

        <div className="a4 system-c">
          {5 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div
            className="page-title"
            style={{
              textAlign: 5 % 2 === 0 ? `end` : `start`,
              marginRight: 5 % 2 === 0 ? `50px` : `0px`,
            }}
          >
            <div>“{appName}”</div>
            <div>mobil ilovasi</div>
          </div>
          <div className="page-content editable">
          <table className="system-table mb-5">      
            <thead>
              <tr>
                <th className="max-w-[50px] w-[50px]">T/r</th>
                <th>Tadbir nomi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="max-w-[50px]">5.</td>
                <td className="max-w-[500px]">Axborot tizimida aniqlangan zaifliklar va yo‘l qo‘yilgan xatoliklar haqiqiyligini tekshirish maqsadida test sinovlari orqali ekspluatatsiya qilib ko‘rish</td>
              </tr>
              <tr>
                <td className="max-w-[50px]">6.</td>
                <td className="max-w-[500px]">O‘rganish bo‘yicha yakuniy ishlarni amalga oshirish</td>
              </tr>
              <tr>
                <td className="max-w-[50px]">7.</td>
                <td className="max-w-[500px]">Test sinovlari orqali ekspluatatsiya qilib ko‘rish</td>
              </tr>
            </tbody>
          </table>
            <div className="system-extra-info">

              <div className="system-two-col">
                <div className="system-col">
                  <div className="system-bar-title">
                    1.5. Ekspertiza yuzasidan qo‘shimcha ma’lumotlar
                  </div>
                  <p className="system-paragraph">
                    “{appName}” axborot tizimida ekspertiza
                    buyurtmachi tomonidan taqdim
                  </p>
                </div>
                <div className="system-col">
                  <p className="system-paragraph">
                    qilingan qayd yozuvi va ma’lumotlar asosida olib borildi
                    (2-jadval).
                  </p>
                </div>
              </div>
              <div className="system-table-label system-table-label-right">
                2-jadval
              </div>
            </div>
          {renderSystemAccountsTable({
            pageRows: systemAccountsPages[0] || [],
            globalStartIndex: systemAccountsPageStarts[0] || 0,
            showAddButton: systemAccountsPages.length <= 1,
          })}
          </div>
          <div className="page-number flex justify-center mt-auto text-white items-center" style={{ bottom: "40px" }}>
            <span className="text-white max-w-[60%] mt-[20px]">
              {appName} | {7 + sectionTablePages.length}
            </span>
          </div>
        </div>
      {systemAccountsPages.slice(1).map((pageRows, extraIdx) => {
        const pageIndex = extraIdx + 1;
        const globalStartIndex = systemAccountsPageStarts[pageIndex] || 0;
        const isLast = pageIndex === systemAccountsPages.length - 1;

        return (
          <div key={`system-accounts-page-${pageIndex}`} className="a4 system-c">
            <img
              className="system-top-img w-full min-w-full"
              src="/assets/system/ax-tops.png"
              alt=""
            />
            <img
              className="system-bottom-img w-full min-w-full"
              src="/assets/system/ax-bottoms.jpg"
              alt=""
            />
            <div
              className="page-title"
              style={{
                textAlign: 5 % 2 === 0 ? `end` : `start`,
                marginRight: 5 % 2 === 0 ? `50px` : `0px`,
              }}
            >
              <div>“{appName}”</div>
              <div>mobil ilovasi</div>
            </div>
            <div className="page-content editable">
              {renderSystemAccountsTable({
                pageRows,
                globalStartIndex,
                showAddButton: isLast,
              })}
            </div>
            <div
              className="page-number flex justify-center mt-auto text-white items-center"
              style={{ bottom: "40px" }}
            >
              <span className="text-white max-w-[60%] mt-[20px]">
                {appName} | {7 + sectionTablePages.length + pageIndex}
              </span>
            </div>
          </div>
        );
      })}
        <div className="a4 system-c">
          {7 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div
            className="page-title"
            style={{
              textAlign: 7 % 2 === 0 ? `end` : `start`,
              marginRight: 7 % 2 === 0 ? `50px` : `0px`,
            }}
          >
            <div>“{appName}”</div>
            <div>mobil ilovasi</div>
          </div>
          <div className="page-content editable">
            <div className="system-section-header">
              <div className="system-section-title">IKKINCHI BO‘LIM.</div>
              <div className="system-section-subtitle">EKSPERTIZA NATIJALARI</div>
            </div>
            <div className="system-bar-title">
              2.1. Ekspertiza natijalari to‘g‘risida umumlashtirilgan ma’lumot
            </div>
            <div className="system-two-col">
              <div className="system-col">
                <p className="system-paragraph">
                  Ekspertiza natijalari asosida 3 xil xavflilik darajasiga ega,
                  ya’ni <b>yuqori, o‘rta</b> va <b>past</b> xavflilik
                  darajasidagi kiberxavfsizlik zaifliklari aniqlanishi mumkin.
                </p>
                <p className="system-paragraph">
                  Kiberxavfsizlik zaifliklari xavflilik darajasidan kelib chiqqan
                  holda axborot tizimiga quyidagi risklar xavf soladi.
                </p>
                <div className="system-highlight">
                  <p className="system-paragraph">
                    <span className="system-term">Yuqori</span> - ushbu turdagi
                    kiberxavfsizlik zaifliklari tizimga eng yuqori xavf
                    ko‘rsatadi. Ulardan foydalanish natijasida tizimga
                    ruxsatsiz kirish, uning ma’lumotlaridan foydalanish,
                    ularni oshkor bo‘lish yoki o‘zgarish holatlariga olib
                    keladi, jumladan konfidensial turdagi ma’lumotlar ham.
                  </p>
                </div>
                <div className="system-highlight">
                  <p className="system-paragraph">
                    <span className="system-term">O‘rta</span> - ushbu turdagi
                    kiberxavfsizlik zaifliklari ko‘p holatlarda boshqa turdagi
                    xavflilik darajasi yuqori bo‘lgan harakatlarni amalga
                    oshirishga, axborot tizimi bilan bog‘liq ma’lumotlarni
                    to‘plashga xizmat qiladi.
                  </p>
                </div>
              </div>
              <div className="system-col">
                <p className="system-paragraph system-highlight">
                  <span className="system-term">Past</span> - ushbu turdagi
                  kiberxavfsizlik zaifliklari axborot tizimida umumiy
                  ma’lumotlarga ega bo‘lish imkoniyatini taqdim etadi.
                </p>
                <p className="system-paragraph">
                  Olib borilgan ekspertiza natijalari asosida aniqlangan
                  kiberxavfsizlik zaifliklari to‘g‘risida umumlashtirilgan
                  ma’lumot 3-jadvalda taqdim qilingan.
                </p>
                <div className="system-table-label">3-jadval</div>
                <table className="system-risk-table">
                  <thead>
                    <tr>
                      <th>Xavflilik darajasi</th>
                      <th>Aniqlangan zaiflik</th>
                      <th>Soni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderRiskTableBody(riskFirstPageRows || [], "risk")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="page-number flex justify-center mt-auto text-white items-center" style={{ bottom: "40px" }}>
            <span className="text-white max-w-[60%] mt-[20px]">{appName} | 10</span>
          </div>
        </div>
        {riskContinuationPages.length > 0 && (
          <>
            {riskContinuationPages.map((p, pageIdx) => {
              const virtualIndex = 8 + pageIdx; // 8 sahifadagi fon tartibi (oldingi kabi)
              const isEven = virtualIndex % 2 === 0;

              return (
                <div key={`risk-cont-${pageIdx}`} className="a4 system-c">
                  {isEven ? (
                    <>
                      <img
                        className="system-top-img w-full min-w-full"
                        src="/assets/system/ax-tops.png"
                        alt=""
                      />
                      <img
                        className="system-bottom-img w-full min-w-full"
                        src="/assets/system/ax-bottoms.jpg"
                        alt=""
                      />
                    </>
                  ) : (
                    <>
                      <img
                        className="system-top-img w-full min-w-full"
                        src="/assets/system/ax-top.png"
                        alt=""
                      />
                      <img
                        className="system-bottom-img w-full min-w-full"
                        src="/assets/system/ax-bottom.jpg"
                        alt=""
                      />
                    </>
                  )}
                  <div
                    className="page-title"
                    style={{
                      textAlign: isEven ? `end` : `start`,
                      marginRight: isEven ? `50px` : `0px`,
                    }}
                  >
                    <div>“{appName}”</div>
                    <div>mobil ilovasi</div>
                  </div>
                  <div className="page-content editable">
                    <div className="system-table-label">3-jadval (davomi)</div>
                    <div className="system-risk-columns">
                      <table className="system-risk-table">
                        <thead>
                          <tr>
                            <th>Xavflilik darajasi</th>
                            <th>Aniqlangan zaiflik</th>
                            <th>Soni</th>
                          </tr>
                        </thead>
                        <tbody>{renderRiskTableBody(p.left || [], `riskl-${pageIdx}`)}</tbody>
                      </table>

                      {!!(p.right || []).length && (
                        <table className="system-risk-table">
                          <thead>
                            <tr>
                              <th>Xavflilik darajasi</th>
                              <th>Aniqlangan zaiflik</th>
                              <th>Soni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renderRiskTableBody(p.right || [], `riskr-${pageIdx}`)}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <div
                    className="page-number flex justify-center mt-auto text-white items-center"
                    style={{ bottom: "40px" }}
                  >
                    <span className="text-white max-w-[60%] mt-[20px]">
                      {appName} | {11 + pageIdx}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {/* <div className="a4 system-c">
          {9 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div
            className="page-title"
            style={{
              textAlign: 9 % 2 === 0 ? `end` : `start`,
              marginRight: 9 % 2 === 0 ? `50px` : `0px`,
            }}
          >
            <div>“{appName}”</div>
            <div>mobil ilovasi</div>
          </div>
          <div className="page-content editable new-content">


            <div className="system-two-col">
              <div className="system-col">
                <div className="system-bar-title">
                  2.2. Ekspertiza natijalari bo‘yicha batafsil izoh
                </div>
                <div className="system-subhead system-highlight">2.2.1. “adm2.sport.uz” veb-resursi</div>
                <div className="system-subtitle">
                  2.2.1.1. Sessiyaning saqlanib qolishi
                </div>
                <p className="system-paragraph">
                  <b>Xavflilik darajasi:</b> Yuqori.
                </p>
                <p className="system-paragraph">
                  Ekspertiza davrida axborot tizimi foydalanuvchisining
                  avtorizatsiya qiymatini saqlanib qolishi holatlari aniqlanadi.
                  Ya’ni foydalanuvchi uchun axborot tizimida shakllantirilgan
                  avtorizatsiyaning qiymati foydalanuvchi tizimda “chiqish”ni
                  amalga oshirgandan keyin ham foydalanuvchining avtorizatsiya
                  tokeni uzoq muddatli aktiv holatda qolishi aniqlanadi.
                </p>
                <p className="system-paragraph">
                  Mazkur turdagi zaiflik CWE (Common Weakness Enumeration)
                  dasturiy va apparat ta’minotlarning zaifliklarini
                  kategoriyalash tizimida “CWE-613” (inglizcha. Insufficient
                  Session Expiration – Seans davomiyligi yetarli emas)
                  identifikator raqamiga ega. Bundan tashqari, “Open Web
                  Application Security Project” (Veb-ilovalarning xavfsizligini
                  ta’minlashning ochiq loyihasi)ning OWASP Top 2021 reytingida:
                  7-o‘rindagi (inglizcha. Identification and Authentication
                  Failures – Identifikatsiya va autentifikatsiyada xatoliklar)
                  zaiflik turiga kiritilgan.
                </p>
              </div>
              <div className="system-col">
                <img
                  className="system-inline-img"
                  src="/assets/tizim.jpg"
                  alt="Ekspertiza skrinshoti"
                />
                <div className="system-figure">
                  1-rasm. Token qiymatini saqlanib qolishi.
                </div>
                <div className="system-subtitle">Ekspluatatsiya oqibatlari</div>
                <p className="system-paragraph">
                  Axborot tizimining ixtiyoriy foydalanuvchisiga tegishli
                  avtorizatsiya qiymatini qo‘lga kiritish, shuningdek ushbu
                  axborot tizimidan foydalanuvchi uchun ajratilgan huquq
                  darajalari doirasida noqonuniy foydalanish holatiga olib
                  kelishi mumkin.
                </p>
                <div className="system-subtitle">Tavsiyalar</div>
                <p className="system-paragraph">
                  Axborot tizimi doirasida foydalanuvchilar sessiyasi bilan
                  bog‘liq dasturiy kod qismlarini qayta ko‘rib chiqish va
                  takomillashtirish.
                </p>
              </div>
            </div>
          </div>
          <div className="page-number flex justify-center mt-auto text-white items-center" style={{ bottom: "40px" }}>
            <span className="text-white max-w-[60%] mt-[20px]">{appName} | 12</span>
          </div>
        </div> */}

         {currentPages &&
          currentPages.map((pageItems, pageIndex) => (
            <div key={pageIndex} className="a4 system-c">
              {pageIndex % 2 === 0 ? (
                <>
                  <img
                    className="system-top-img w-full min-w-full"
                    src="/assets/system/ax-tops.png"
                    alt=""
                  />
                  <img
                    className="system-bottom-img w-full min-w-full"
                    src="/assets/system/ax-bottoms.jpg"
                    alt=""
                  />
                </>
              ) : (
                <>
                  <img
                    className="system-top-img w-full min-w-full"
                    src="/assets/system/ax-top.png"
                    alt=""
                  />
                  <img
                    className="system-bottom-img w-full min-w-full"
                    src="/assets/system/ax-bottom.jpg"
                    alt=""
                  />
                </>
              )}
              <div
                className="page-title"
                style={{
                  width: "85%",
                  textAlign: pageIndex % 2 === 0 ? "end" : "start",
                  marginRight: pageIndex % 2 === 0 ? "50px" : "0px",
                }}
              >
                <div>“{appName}”</div>
                <div>mobil ilovasi</div>
              </div>

              <div className="page-content editable new-content">
                <div className="system-two-col-flow">
                  {pageItems.map((item, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </div>
              </div>

              <div className="page-number flex justify-center mt-auto text-white items-center" style={{ bottom: "40px" }}>
                <span className="text-white max-w-[60%] mt-[20px]">{appName} | {pageIndex + 17}</span>
              </div>
            </div>
          ))}

        <div className="a4 system-c">
          {10 % 2 === 0 ? (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-tops.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottoms.jpg"
                alt=""
              />
            </>
          ) : (
            <>
              <img
                className="system-top-img w-full min-w-full"
                src="/assets/system/ax-top.png"
                alt=""
              />
              <img
                className="system-bottom-img w-full min-w-full"
                src="/assets/system/ax-bottom.jpg"
                alt=""
              />
            </>
          )}
          <div
            className="page-title"
            style={{
              textAlign: 10 % 2 === 0 ? `end` : `start`,
              marginRight: 10 % 2 === 0 ? `50px` : `0px`,
            }}
          >
            <div>“{appName}”</div>
            <div>mobil ilovasi</div>
          </div>
          <div className="page-content editable">
            <div className="system-section-header">
              <div className="system-section-title">UCHINCHI BO‘LIM.</div>
              <div className="system-section-subtitle">UMUMIY XULOSA</div>
            </div>
            <div className="system-two-col">
              <div className="system-col">
                <p className="system-paragraph">
                  “{appName}” axborot tizimi kiberxavfsizlik
                  talablariga muvofiqligi yuzasidan o‘tkazilgan ekspertiza
                  natijasida kiberxavfsizlikning yuqori va o‘rta darajadagi
                  zaifliklari aniqlandi.
                </p>
                <p className="system-paragraph">
                  Ekspertiza davrida aniqlangan zaifliklar tizim va uning
                  resurslaridan (funksional imkoniyatlaridan) ruxsatsiz
                  foydalanish, zararli fayllarni yuklash va tarqatish,
                  ma’lumotlarni oshkor bo‘lish va sizib chiqish holatlariga olib
                  kelishi mumkin.
                </p>
                <p className="system-paragraph">
                  Shu o‘rinda ushbu salbiy holatlarni oldini olish, shuningdek
                  kiberxavfsizlikni ta’minlanganlik darajasini yaxshilash
                  maqsadida aniqlangan kiberxavfsizlik zaifliklarini bartaraf
                  etish yuzasidan tavsiyalarni inobatga olish hamda quyidagi
                  chora-tadbirlar amalga oshirish tavsiya etiladi:
                </p>
                <ul className="system-paragraph">
                  <li>
                    doimiy ravishda operatsion tizimlar, dasturiy ta’minotlar va
                    himoya vositalarining versiyalarini hamda signaturalar
                    bazasini yangilanishini qo‘llab-quvvatlash;
                  </li>
                  <li>
                    axborotni himoya qilish vositalari, xususan “WAF” va
                    “IDS/IPS”lardan samarali foydalanish;
                  </li>
                </ul>
              </div>
              <div className="system-col">
                <ul className="system-paragraph">
                  <li>
                    davriy muddatlarda ishlab chiqilgan yoki joriy etilgan
                    axborot tizimlarini kiberxavfsizlik talablari bo‘yicha
                    tekshiruvdan o‘tkazish;
                  </li>
                  <li>
                    tizimning autentifikatsiya jarayonlarida “Elektron raqamli
                    imzo”lardan, “OTP”lardan foydalanishni doimiy qo‘llab-quvvatlash;
                  </li>
                  <li>
                    inyeksiya va mazkur turga oid zaifliklarni bartaraf etish
                    yuzasidan choralar ko‘rish davrida barcha ma’lumotlarni
                    kiritish qismlarini ham inobatga olish tavsiya etiladi.
                  </li>
                </ul>
                <div className="system-note-title">Ma’lumot o‘rnida:</div>
                <p className="system-note">
                  Ekspertiza hisobotі 2025-yil 18-dekabr kunida olingan yakuniy
                  tahliliy natijalar asosida shakllantirilgan. Shu munosabat
                  bilan, “Kiberxavfsizlik markazi” DUK mazkur muddatdan tashqari
                  vaqtlarda aniqlangan kiberxavfsizlik zaifliklari yuzasidan
                  javobgarlikni o‘z zimmasiga olmaydi.
                </p>
              </div>
            </div>
          </div>
          <div className="page-number flex justify-center mt-auto text-white items-center" style={{ bottom: "40px" }}>
            <span className="text-white max-w-[60%] mt-[20px]">{appName} | 13</span>
          </div>
        </div>
       

       

        <div className="a4 system-b"></div>
      </div>
    </>
  );
};

export default SystemWord;
