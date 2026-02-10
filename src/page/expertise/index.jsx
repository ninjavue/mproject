import React, { use, useEffect, useRef, useState } from "react";
import "../dashboard/dashboard.css";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import Select from "react-select";

import ExpertizaTable from "../../components/table";

import { METHOD } from "../../api/zirhrpc";
import { useZirhStref } from "../../context/ZirhContext";
import toast from "react-hot-toast";
import { sendRpcRequest } from "../../rpc/rpcClient";
import { downloadFileViaRpc, uploadFileViaRpc } from "../../rpc/fileRpc";

const Card = ({ label, value, icon, accent = "teal", onClick, isSelected }) => {
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`stat-card group relative overflow-hidden rounded-2xl border bg-white/80 bg-gradient-to-br from-white via-white to-slate-50
         shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#2b2c40]/80 
         dark:from-[#2b2c40] dark:via-[#2b2c40] dark:to-[#222433] ${isSelected ? "-translate-y-1 shadow-xl" : "border-slate-200/70"} ${onClick ? "cursor-pointer" : ""}`}
      data-accent={accent}
    >
      <div className="stat-card__top">
        <div className="stat-card__label text-sm font-medium tracking-wide text-[#718193] dark:text-gray-200">
          {label}
        </div>
        <div
          className="stat-card__icon rounded-xl p-3 shadow-inner"
          style={{
            color: accent == "muted" ? "#8592a3" : accent,
            background: hexToRgba(accent, 0.1),
          }}
          aria-hidden
        >
          <i
            className={`${icon} text-3xl`}
            style={{ width: 36, height: 36 }}
          ></i>
          {/* <iconify-icon icon={icon} width="36" height="36" /> */}
        </div>
      </div>
      <div className="stat-card__value text-3xl font-semibold text-[#566a7f] dark:text-gray-300">
        {value}
      </div>
    </div>
  );
};

const Section = ({ title, items, selectedStatusId, onCardClick }) => (
  <section className="stats-section">
    <h3 className="stats-section__title">{title}</h3>
    <div className="stats-grid">
      {items.map((it, i) => (
        <Card
          key={i}
          label={it.label}
          value={it.value}
          icon={it.icon}
          accent={it.accent}
          isSelected={selectedStatusId === it.id}
          onClick={onCardClick ? () => onCardClick(it.id) : undefined}
        />
      ))}
    </div>
  </section>
);

const orgTypes = ["DUK", "MCHJ", "AJ", "ATB", "AITB", "DM"];

const STATUS_STEPS = [
  { id: 1, label: "Shartnoma kelgan" },
  { id: 2, label: "Tizimga qo'shilgan" },
  { id: 3, label: "Xat chiqarilgan" },
  { id: 4, label: "Xat kelgan" },
  { id: 5, label: "Jarayonda" },
  { id: 6, label: "Hisobotga chiqarilgan" },
  { id: 7, label: "Qisman yakunlangan" },
  { id: 8, label: "Qayta expertiza" },
  { id: 9, label: "To'liq yakunlangan" },
  { id: 10, label: "Vaqtincha to'xtatilgan" },
];

const ITEMS_PER_PAGE = 10;

const Expertise = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedVuln, setSelectedVuln] = useState("");
  const [zaiflikText, setZaiflikText] = useState("");
  const [oqibatlarText, setOqibatlarText] = useState("");
  const [tavsiyaText, setTavsiyaText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOpen1, setDrawerOpen1] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [changedFields, setChangedFields] = useState([]);
  const [fileName, setFileName] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const { stRef } = useZirhStref();
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [savingField, setSavingField] = useState(null); // 'startDate' | 'initialHash' | 'finalHash'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [expertize, setExpertize] = useState([]);
  const [isPage, setIsPage] = useState(1);
  const [justPage, setJustPage] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [signleExp, setSingleExp] = useState(null);
  const [user, setUser] = useState({});

  const [formData, setFormData] = useState({
    orgName: "",
    orgId: "",
    orgTypeId: "",
    controllers: "",
    workers: "",
    ordName: "",
    ordPrice: "",
    contract: null,
    contractNumber: "",
    contractDate: "",
    contractPriceDate: "",
    resPer: "",
    orgType: "",
    ordEndDate: "",
    system: 1,
    initialHashFile: null,
    finalHashFile: null,
  });
  const [editItemOld, setEditItemOld] = useState({
    orgName: "",
    orgId: "",
    orgTypeId: "",
    controllers: "",
    workers: "",
    ordName: "",
    ordPrice: "",
    contract: null,
    contractNumber: "",
    contractDate: "",
    contractPriceDate: "",
    resPer: "",
    orgType: "",
    ordEndDate: "",
    initialHashFile: null,
    finalHashFile: null,
  });

  const [selectedProcessStep, setSelectedProcessStep] = useState("");
  const [processStepDate, setProcessStepDate] = useState(null);
  const [processStepFile, setProcessStepFile] = useState(null);
  const [processStepFileName, setProcessStepFileName] = useState("");
  const [processStepNote, setProcessStepNote] = useState("");
  const [savedProcessStepStatus, setSavedProcessStepStatus] = useState("");
  const [savedProcessStepDate, setSavedProcessStepDate] = useState(null);
  const [savedProcessStepFileName, setSavedProcessStepFileName] = useState("");
  const [savedProcessStepNote, setSavedProcessStepNote] = useState("");
  const [count, setCount] = useState(0);
  const [statusCount, setStatusCount] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(0);

  const system = [
    {
      id: 0,
      label: "Jami:",
      value: count,
      accent: "blue",
      icon: "bx bxs-circle",
    },
    {
      id: 1,
      label: "Shartnoma kelgan:",
      value: statusCount.find((item) => item.id === 1)?.count || 0,
      accent: "green",
      icon: "bx bxs-circle-half",
    },
    {
      id: 9,
      label: "To'liq yakunlangan:",
      value: statusCount.find((item) => item.id === 9)?.count || 0,
      accent: "green",
      icon: "bx bxs-circle-half",
    },
    {
      id: 7,
      label: "Qisman yakunlangan:",
      value: statusCount.find((item) => item.id === 7)?.count || 0,
      accent: "aqua",
      icon: "bx bxs-circle-quarter",
    },
    {
      id: 3,
      label: "Xat chiqarilgan:",
      value: statusCount.find((item) => item.id === 3)?.count || 0,
      accent: "muted",
      icon: "bx bxs-circle-quarter",
    },
    {
      id: 4,
      label: "Xat kelgan:",
      value: statusCount.find((item) => item.id === 4)?.count || 0,
      accent: "muted",
      icon: "bx bxs-circle-quarter",
    },
    {
      id: 5,
      label: "Jarayonda:",
      value: statusCount.find((item) => item.id === 5)?.count || 0,
      accent: "aqua",
      icon: "bx bxs-circle-half",
    },
    {
      id: 67,
      label: "O'tib ketgan:",
      value: 0,
      accent: "red",
      icon: "bx bxs-circle-half",
    },
    {
      id: 6,
      label: "Hisobotga chiqarilgan:",
      value: statusCount.find((item) => item.id === 6)?.count || 0,
      accent: "blue",
      icon: "bx bxs-circle-three-quarter",
    },
    {
      id: 8,
      label: "Qayta ekspertizada:",
      value: statusCount.find((item) => item.id === 8)?.count || 0,
      accent: "aqua",
      icon: "bx bxs-circle-quarter",
    },
    {
      id: 10,
      label: "Vaqtincha to'xtatilgan:",
      value: statusCount.find((item) => item.id === 10)?.count || 0,
      accent: "red",
      icon: "bx bxs-circle-three-quarter",
    },
    {
      id: 2,
      label: "Tizimga qo'shilgan:",
      value: statusCount.find((item) => item.id === 2)?.count || 0,
      accent: "muted",
      icon: "bx bxs-circle-quarter",
    },
  ];

  const handlePdf = () => {
    navigate("/page/viewer");
  };

  const handleModal = (id) => {
    // console.log(id);
    const exp = expertize.find((item) => item.id === id);
    setSingleExp(exp);
    // console.log(exp);
    handleNewCreate(exp);
    setIsModalOpen(!isModalOpen);
    if (isModalOpen) {
      setSelectedVuln("");
      setZaiflikText("");
      setOqibatlarText("");
      setTavsiyaText("");
    }
  };

  const openDrawer = () => {
    setIsUpdate(false);
    setEditId(null);
    setChangedFields([]);
    setFileName(null);
    setFormData({
      orgName: "",
      orgId: "",
      orgTypeId: "",
      controllers: "",
      workers: "",
      ordName: "",
      ordPrice: "",
      contract: null,
      contractNumber: "",
      contractDate: "",
      contractPriceDate: "",
      resPer: "",
      orgType: "",
      ordEndDate: "",
      system: 1,
      initialHashFile: null,
      finalHashFile: null,
    });
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  const closeDrawer1 = () => setDrawerOpen1(false);

  const getUserFullNameById = (userId) => {
    const user = items.find((item) => item.id === userId);

    if (user) {
      return `${user.surname} ${user.name}`;
    }

    return "Foydalanuvchi topilmadi";
  };

  const handleCreate = async () => {
    // console.log(formData);
    // return
    if (
      !formData.orgName ||
      !formData.ordName ||
      !formData.contract ||
      !formData.contractNumber ||
      !formData.contractDate ||
      !formData.contractPriceDate ||
      !formData.ordEndDate ||
      !formData.orgType ||
      !formData.orgTypeId ||
      !formData.controllers ||
      !formData.workers ||
      !formData.resPer ||
      !formData.ordPrice
    ) {
      toast.error("Tashkilot nomi, Tizim nomi va Shartnoma fayli majburiy!");
      return;
    }
    setUploadProgress(0);
    setIsUploading(true);

    const file = formData.contract;

    const doneRes = await uploadFileViaRpc(
      stRef,
      file,
      null,

      (p) => {
        // console.log(p);
        setUploadProgress(p);
      },
    );
    // console.log(doneRes);
    // console.log(formData);

    formData.contract = doneRes.fileId;
    // console.log(doneRes);
    const payload = {
      1: formData.orgName,
      2: formData.orgId,
      3: formData.orgTypeId,
      4: [...formData.controllers, ...formData.workers],
      6: formData.ordName,
      7: formData.ordPrice,
      8: formData.contractNumber,
      9: {
        1: formData.contract,
        2: fileName,
        3: file.size,
      },
      10: formData.contractDate,
      11: formData.contractPriceDate,
      12: formData.resPer,
      13: formData.ordEndDate,
      14: formData.orgType,
      15: formData.system,
    };

    // console.log(payload);
    const res = await sendRpcRequest(stRef, METHOD.ORDER_CREATE, payload);
    // console.log(res);

    if (res.status == METHOD.OK) {
      toast.success("Muvaffaqiyatli qo'shildi!");
      const newId = res[1]?.id
        ? typeof res[1].id === "string"
          ? res[1].id
          : bufferToObjectId(res[1].id?.buffer || res[1]._id?.buffer)
        : `temp-${Date.now()}`;
      const newRow = {
        id: newId,
        orgName: formData.orgName,
        orgUuid: formData.orgId,
        shortName: formData.ordName,
        inn: formData.ordPrice,
        director: formData.resPer,
        orgType: formData.orgType,
        number: formData.contractNumber,
        contractDate: formData.contractDate,
        startDate: formData.contractPriceDate,
        endDate: formData.ordEndDate,
        status: 1,
        files: formData.contract ? [{ 2: fileName }] : [],
        controllers: formData.controllers || [],
        workers: formData.workers || [],
        active: true,
      };
      setExpertize((prev) => [newRow, ...(prev || [])]);
    } else {
      toast.error("Xatolik yuz berdi!");
    }

    setFormData({
      surname: "",
      name: "",
      partName: "",
      email: "",
      role: "",
      department: "",
      phone: "",
      image: "",
    });
    closeDrawer();
  };

  const saveStartDate = async () => {
    if (!editId || !formData.startDate) return;
    setSavingField("startDate");
    try {
      const res1 = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: editId,
        2.8: formData.startDate,
      });
      if (res1.status !== METHOD.OK) {
        toast.error(res1?.message || "Sanani saqlashda xatolik");
        return;
      }
      const res2 = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: editId,
        3: 5,
      });
      if (res2.status === METHOD.OK) {
        toast.success("Sana saqlandi!");
        setEditItemOld((prev) => ({ ...prev, startDate: formData.startDate }));
      } else {
        toast.error(res2?.message || "Status yangilashda xatolik");
      }
    } catch (error) {
      toast.error(error?.message || "Saqlashda xatolik");
    } finally {
      setSavingField(null);
    }
  };

  const saveInitialHashFile = async () => {
    if (
      !editId ||
      !formData.initialHashFile ||
      !(formData.initialHashFile instanceof File)
    )
      return;
    setSavingField("initialHash");
    try {
      setUploadProgress(0);
      setIsUploading(true);
      const uploadRes = await uploadFileViaRpc(
        stRef,
        formData.initialHashFile,
        editId,
        (p) => {
          setUploadProgress(p);
          if (p === 100) setIsUploading(false);
        },
      );
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: editId,
        6.9: {
          1: uploadRes.fileId,
          2: formData.initialHashFile.name,
          3: formData.initialHashFile.size,
        },
      });
      if (res.status === METHOD.OK) {
        toast.success("Boshlang'ich hash fayli saqlandi!");
        setFormData((prev) => ({ ...prev, initialHashFile: null }));
        setEditItemOld((prev) => ({ ...prev, initialHashFile: null }));
      } else {
        toast.error(res?.message || "Saqlashda xatolik");
      }
    } catch (error) {
      toast.error(error?.message || "Saqlashda xatolik");
    } finally {
      setSavingField(null);
    }
  };

  const saveFinalHashFile = async () => {
    if (
      !editId ||
      !formData.finalHashFile ||
      !(formData.finalHashFile instanceof File)
    )
      return;
    setSavingField("finalHash");
    try {
      setUploadProgress(0);
      setIsUploading(true);
      const uploadRes = await uploadFileViaRpc(
        stRef,
        formData.finalHashFile,
        editId,
        (p) => {
          setUploadProgress(p);
          if (p === 100) setIsUploading(false);
        },
      );
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: editId,
        6.11: {
          1: uploadRes.fileId,
          2: formData.finalHashFile.name,
          3: formData.finalHashFile.size,
        },
      });

      // console.log(res);
      if (res.status === METHOD.OK) {
        toast.success("Yakuniy hash fayli saqlandi!");
        setFormData((prev) => ({ ...prev, finalHashFile: null }));
        setEditItemOld((prev) => ({ ...prev, finalHashFile: null }));
      } else {
        toast.error(res?.message || "Saqlashda xatolik");
      }
    } catch (error) {
      toast.error(error?.message || "Saqlashda xatolik");
    } finally {
      setSavingField(null);
    }
  };

  const formatBufferToId = (data) => {
    if (!data) return null;
    const bufferArray = data.buffer
      ? Object.values(data.buffer)
      : Object.values(data);

    return bufferArray
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  };

  function bufferToObjectId(bufferObj) {
    const bytes = Object.values(bufferObj);
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const getAllExpertize = async (
    id = null,
    nextPage = true,
    statusId = 0,
    searchText = null,
  ) => {
    try {
      const payload = {
        1: id,
        2: nextPage,
        3: 1,
        4: statusId,
      };
      const trimmed = searchText != null ? String(searchText).trim() : "";
      if (trimmed !== "") {
        payload[5] = trimmed;
      }else{
        payload[5] = null;
      }
      const res = await sendRpcRequest(stRef, METHOD.ORDER_GET_PAGE, payload);
      // console.log(res);
      if (res.status == METHOD.OK) {
        const page = formatBufferToId(res[1].cursorId);
        if (page != null) {
          setIsPage(page);
        }
        setNextPage(page);

        // if()

        const list = res[1]?.docs;

        // console.log(res[1]);

        if (!Array.isArray(list)) {
          // console.error("docs kelmadi yoki array emas", res);
          return;
        }

        const formattedData = list.map((item) => {
          const base = item["1"] || [];
          const dates = item["2"] || {};
          const sU = item["5"];
          // console.log(sU);
          return {
            id: bufferToObjectId(item._id?.buffer),
            repport: base["10"] || "",
            orgName: base[0] || "",
            orgUuid: base[1] || "",
            shortName: base[3] || "",
            inn: base[4] || "",
            director: base[5] || "",
            orgType: base[6] || "",
            contractDate: dates["1"] || null,
            startDate: dates["8"] || null,
            endDate: dates["3"] || null,
            status: item["3"],
            number: item["10"],
            files: item["6"] || [],
            controllers: (item["7"] || []).filter((p) => p.a3 === 1),
            workers: (item["7"] || []).filter((p) => p.a3 === 2),
            active: item["18"],
            dates: item["2"] || {},
            sU: sU,
          };
        });


        // console.log(formattedData);

        return formattedData;
      }
      // console.log(res);
      // return;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const getAllUser = async () => {
      try {
        const res = await sendRpcRequest(stRef, METHOD.USER_GET_FULL, {});
        if (res.status === METHOD.OK) {
          const mappedItems = await Promise.all(
            res[1].map(async (user, index) => {
              const info = user["4"] || [];

              return {
                id: bufferToObjectId(user._id?.buffer),
                email: user["1"] || "",
                role: user["3"] || "",
                department: info[0] || "",
                surname: info[1] || "",
                name: info[2] || "",
                partName: info[3] || "",
                phone: info[4] || "",
                count: user["7"] || user[7],
              };
            }),
          );

          // console.log(expertize);
          setItems(mappedItems);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getAllUser();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getAllExpertize(
        null,
        true,
        selectedStatusId,
        debouncedSearchTerm || null,
      );
      if (data) {
        setExpertize(data);
        setJustPage(0);
      }
    };
    fetch();
  }, [debouncedSearchTerm, selectedStatusId]);

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredExpertize = normalizedQuery
    ? (expertize || []).filter((item) => {
        const controllers = (item.controllers || []).map((c) => c.a2).join(" ");
        const workers = (item.workers || []).map((w) => w.a2).join(" ");
        const haystack = [
          item.orgName,
          item.shortName,
          item.number,
          item.orgUuid,
          item.orgType,
          item.director,
          controllers,
          workers,
          item.hisobot,
          item.ball,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : expertize || [];

  const totalItems = filteredExpertize.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredExpertize.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [expertize?.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setProcessStepDate(null);
    setProcessStepFile(null);
    setProcessStepFileName("");
    setProcessStepNote("");
    setSavedProcessStepDate(null);
    setSavedProcessStepFileName("");
    setSavedProcessStepNote("");
  }, [selectedProcessStep]);

  const downloadFileAll = async (id) => {
    await downloadFileViaRpc(stRef, id, id, (p) => {
      // console.log(p);
      setUploadProgress(p);
      setIsUploading(true);
      if (p === 100) setIsUploading(false);
    });
  };

  const handleVulnChange = (e) => {
    const value = e.target.value;
    setSelectedVuln(value);

    if (value === "Ilova kodini yaxlitligi joriy etilmaganligi") {
      setZaiflikText(
        `Ilova o‘z kodlari va imzo ma’lumotlarining yaxlitligini va haqiqiyligini tekshirmaydi. Bunday holatda ilova qayta yig’ilgan, statik modifikatsiyaga uchragan yoki noto‘g‘ri/soxta sertifikat bilan imzolangan bo‘lsa, server yoki ilova buni aniqlay olmaydi. Mazkur turdagi zaiflik “MASWE-0104” (inglizcha. App Integrity Not Verified – Ilova yaxlitligi tasdiqlanmasligi) identifikator raqamiga ega kategoriyaga mansub.`,
      );
      setOqibatlarText(
        `Ilovani kodiga o’zgartirish kiritish va uni qayta yig‘ish, zararli kod qo‘shish yoki imzoni almashtirib, foydalanuvchilarga zarar yetkazuvchi soxta talqinlarni tarqatish.`,
      );
      setTavsiyaText(
        `Ilova ishga tushganida o‘zining imzosini, to’liqligini tekshirish mexanizmini quyi darajadagi (Native C++) dasturlash tillaridan foydalangan holda joriy etish.`,
      );
    } else if (value === "Malumotlarni oshkor etilishi") {
      setZaiflikText(`Ekspertiza davrida axborot tizimiga tegishli ichki ma’lumotlar, xususan muhim qismlarga kirish oynalari, turli xil kengaytmadagi fayllar Internet tarmog‘ining barcha foydalanuvchilari uchun ochiq holatdaligi, ya’ni ichki resurslarga bo‘ladigan murojaatlarni boshqarish hamda nazorat qilish mexanizmlari qo‘llanmaganlik holati aniqlandi.

Mazkur turdagi zaiflik CWE (Common Weaknes Enumeration) dasturiy va apparat ta’minotlarning zaifliklarini kategoriyalash tizimida “CWE-200” (inglizcha. Exposure of Sensitive Information to an Unauthorized Actor – Ishonchsiz foydalanuvchiga ma’lumotlarni ochiqlanishi) identifikator raqamiga ega kategoriyaga mansub.

Bundan tashqari, “Open Web Application Security Project” (Veb-ilovalarning xavfsizligini ta’minlash ochiq loyihasi) OWASP Top 2021 reytingida: 1-o‘rindagi (inglizcha. Broken Access Control – Ruxsatlar nazoratini buzilishi) zaiflik turiga kiritilgan.

Quyidagi misolda aniqlangan zaiflik ekspluatatsiyasi holati taqdim etilgan.`);
      setOqibatlarText(
        `Mazkur holat, ixtiyoriy Internet tarmog‘i foydalanuvchisiga resurslarga murojaat qilish orqali ulardan foydalanish imkoniyatini taqdim etadi.`,
      );
      setTavsiyaText(
        `Ushbu qism bilan bog‘liq dasturiy kodni qayta ko‘rib chiqish hamda takomillashtirish.`,
      );
    } else if (value === "Himoyalanmagan havolalar") {
      setZaiflikText(`Ilovadagi URL manzillar teskari muhandislik usulini ishlatgan holda oxirgi nuqtalar va/yoki kutubxonalar haqida maʼlumotlarni olish imkoniyatini beradi. Ushbu ma’lumotlardan uchinchi tomon ruxsatsiz ilovalar yoki skriptlar yozish uchun foydalanishi mumkin.

Bundan tashqari, agar shifrlash to‘g‘ri sozlanmagan bo‘lsa, tarmoqdagi tajovuzkor barcha aloqalarni ko‘rishi va tarkibni o‘zboshimchalik bilan o‘zgartirishi mumkin. Agar ma’lumotlar ilovaning nozik joylarida ishlatilsa yoki ma’lumotlar ijroga ta’sir qilsa, bu ilovada jiddiy oqibatlarga olib kelishi mumkin.

Mazkur turdagi zaiflik “MASWE-0058” (inglizcha. Insecure Deep Links – Xavfsiz bo‘lmagan havolalar) identifikator raqamiga ega kategoriyaga mansub. Shuningdek, OWASP Mobile Top 10 2024 reytingida 8-o‘rinda (inglizcha. Security Misconfiguration – Noto‘g‘ri xavfsizlik konfiguratsiyasi) zaiflik turiga kiritilgan.`);
      setOqibatlarText(
        `Ochiq havolalar to‘g‘risida ma’lumotlarni qo‘lga kiritish holatiga olib kelishi mumkin.`,
      );
      setTavsiyaText(
        `Ilovada foydalanilayotgan tashqi va ichki resurs havolalarini ochiq matn shaklida saqlamaslik.`,
      );
    } else {
      setZaiflikText("");
      setOqibatlarText("");
      setTavsiyaText("");
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (!isUpdate) return;

    const map = {
      orgName: 4.1,
      orgId: 4.2,
      orgTypeId: 4.3,
      ordName: 4.4,
      ordPrice: 4.5,
      contractNumber: 4.6,
      contractDate: 4.7,
      contractPriceDate: 4.8,
      contract: 4.9,
      resPer: 5,
      controllers: 5.1,
      orgType: 5.2,
      workers: 5.3,
      ordEndDate: 5.4,
      permLetter: 5.5,
      consentLetter: 5.6,
    };

    const code = map[name];
    if (!code) return;

    if (value === editItemOld[name]) {
      setChangedFields((prev) => prev.filter((c) => c !== code));
    } else {
      setChangedFields((prev) =>
        prev.includes(code) ? prev : [...prev, code],
      );
    }
  };

  const markFieldChanged = (code, value, oldValue) => {
    if (!isUpdate) return;
    const isSame = value === oldValue;
    setChangedFields((prev) => {
      if (isSame) {
        return prev.filter((c) => c !== code);
      }
      return prev.includes(code) ? prev : [...prev, code];
    });
  };

  const focusField = (fieldId) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const fallback = document.querySelector(
      `[data-field="${fieldId}"] input, [data-field="${fieldId}"] .MuiPickersSectionList-root`,
    );
    if (fallback && fallback.focus) {
      fallback.focus();
      fallback.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    setFormData((prev) => ({
      ...prev,
      contract: file,
    }));

    if (isUpdate) {
      const isChanged = true;
      setChangedFields((prev) => {
        if (isChanged && !prev.includes(4.9)) {
          return [...prev, 4.9];
        }
        return prev;
      });
    }
  };
  const handleFileChange1 = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    setFormData((prev) => ({
      ...prev,
      permLetter: file,
    }));

    if (isUpdate) {
      const isChanged = true;
      setChangedFields((prev) => {
        if (isChanged && !prev.includes(4.9)) {
          return [...prev, 4.9];
        }
        return prev;
      });
    }
  };
  const handleFileChange2 = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    setFormData((prev) => ({
      ...prev,
      consentLetter: file,
    }));

    if (isUpdate) {
      const isChanged = true;
      setChangedFields((prev) => {
        if (isChanged && !prev.includes(4.9)) {
          return [...prev, 4.9];
        }
        return prev;
      });
    }
  };

  const handleInitialHashFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, initialHashFile: file }));
  };

  const handleFinalHashFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, finalHashFile: file }));
  };

  const handleHashDrop = (field, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (field === "initial") {
      setFormData((prev) => ({ ...prev, initialHashFile: file }));
    } else {
      setFormData((prev) => ({ ...prev, finalHashFile: file }));
    }
  };

  const handleHashDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleProcessStepFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcessStepFileName(file.name);
    setProcessStepFile(file);
  };

  const sendProcessStepPayload = async (payload) => {
    if (!formData.id) {
      toast.error("Buyurtma tanlanmagan");
      return false;
    }
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, payload);
      if (res.status === METHOD.OK) {
        if (payload[3] != null) {
          setExpertize((prev) =>
            (prev || []).map((item) =>
              item.id === formData.id ? { ...item, status: payload[3] } : item,
            ),
          );
        }
        toast.success("Saqlandi");
        return true;
      }
      toast.error(res.message || "Saqlashda xatolik");
      return false;
    } catch (err) {
      // console.error(err);
      toast.error("Saqlashda xatolik");
      return false;
    }
  };

  const handleTekshirtirish = async (orderId) => {
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: orderId,
        5: 2,
      });
      if (res.status === METHOD.OK) {
        setExpertize((prev) =>
          (prev || []).map((item) =>
            item.id === orderId ? { ...item, sU: 2 } : item,
          ),
        );
        toast.success("Tekshirishga yuborildi");
      } else {
        toast.error(res.message || "Xatolik");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Saqlashda xatolik");
    }
  };
  const handleNextExp = async (orderId) => {
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: orderId,
        5: 3,
      });
      if (res.status === METHOD.OK) {
        setExpertize((prev) =>
          (prev || []).map((item) =>
            item.id === orderId ? { ...item, sU: 3 } : item,
          ),
        );
        toast.success("Bo'lim boshlig'iga yuborildi");
      } else {
        toast.error(res.message || "Xatolik");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Saqlashda xatolik");
    }
  };

  const handleBackExp = async (orderId) => {
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, {
        19: orderId,
        5: 1,
      });
      if (res.status === METHOD.OK) {
        setExpertize((prev) =>
          (prev || []).map((item) =>
            item.id === orderId ? { ...item, sU: 1 } : item,
          ),
        );
        toast.success("Bajaruvchiga yuborildi");
      } else {
        toast.error(res.message || "Xatolik");
      }
    } catch (err) {
      // console.error(err);
      toast.error("Saqlashda xatolik");
    }
  };

  const handleSaveProcessStepStatus = async () => {
    if (!selectedProcessStep) {
      toast.error("Jarayonni tanlang");
      return;
    }
    const ok = await sendProcessStepPayload({
      19: formData.id,
      3: parseInt(selectedProcessStep, 10),
    });
    if (ok) setSavedProcessStepStatus(selectedProcessStep);
  };

  const handleSaveProcessStepDate = async (dateKey) => {
    if (!processStepDate) {
      toast.error("Sanani tanlang");
      return;
    }
    const ok = await sendProcessStepPayload({
      19: formData.id,
      [dateKey]: processStepDate,
    });
    if (ok) setSavedProcessStepDate(processStepDate);
  };

  const handleSaveProcessStepFile = async (fileKey) => {
    if (!processStepFile) {
      toast.error("Faylni tanlang");
      return;
    }
    setUploadProgress(0);
    setIsUploading(true);
    try {
      const uploadRes = await uploadFileViaRpc(
        stRef,
        processStepFile,
        formData.id,
        (p) => {
          setUploadProgress(p);
          if (p === 100) setIsUploading(false);
        },
      );
      const fileSize = processStepFile.size || 0;
      const name = processStepFileName || processStepFile.name;
      const ok = await sendProcessStepPayload({
        19: formData.id,
        [fileKey]: {
          1: uploadRes.fileId,
          2: name,
          3: fileSize,
        },
      });
      if (ok) setSavedProcessStepFileName(name);
    } catch (err) {
      setIsUploading(false);
      throw err;
    }
  };

  const userMe = async () => {
    const res = await sendRpcRequest(stRef, METHOD.USER_GET, {});
    if (res.status === METHOD.OK) {
      // console.log(res[1]);
      const u = {
        id: formatBufferToId(res[1]?._id),
        email: res[1][1],
        full_name: res[1][4]?.[1] + " " + res[1][4]?.[2] + " " + res[1][4]?.[3],
        role: res[1][3],
      };

      setUser(u);
    }
  };

  useEffect(() => {
    userMe();
  }, []);

  const handleSaveProcessStepNote = async () => {
    if (!processStepNote?.trim()) {
      toast.error("Ma'lumot yozing");
      return;
    }
    const trimmed = processStepNote.trim();
    const ok = await sendProcessStepPayload({
      19: formData.id,
      1.11: trimmed,
    });
    if (ok) setSavedProcessStepNote(trimmed);
  };

  const handleEdit = async (item) => {
    // console.log(item);
    try {
      if (item) {
        setFormData({
          ...formData,
          id: item.id,
          orgName: item.orgName,
          orgId: item.orgUuid,
          orgTypeId: item.orgUuid,
          ordName: item.shortName,
          ordPrice: item.inn,
          contractNumber: item.number,
          contractDate: item.contractDate,
          contractPriceDate: item.startDate,
          resPer: item.director,
          contract: item.files[0]?.["2"],
          controllers: item.controllers,
          orgType: item.orgType,
          workers: item.workers,
          ordEndDate: item.endDate,
        });
        setEditItemOld({
          ...formData,
          id: item.id,
          orgName: item.orgName,
          orgId: item.orgUuid,
          orgTypeId: item.orgUuid,
          ordName: item.shortName,
          ordPrice: item.inn,
          contractNumber: item.number,
          contractDate: item.contractDate,
          contractPriceDate: item.startDate,
          resPer: item.director,
          contract: item.files[0]?.["2"],
          controllers: item.controllers,
          orgType: item.orgType,
          workers: item.workers,
          ordEndDate: item.endDate,
        });
        setEditId(item.id);
        setIsUpdate(true);
        setDrawerOpen(true);
      } else {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleNextStep = async (item) => {
    try {
      // console.log(item);
      setEditId(item.id);
      setFormData((prev) => ({
        ...prev,
        id: item.id,
        contractDate: item.contractDate || prev.contractDate,
        initialHashFile: null,
        finalHashFile: null,
      }));
      setDrawerOpen1(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleIsJarayon = () => {
    try {
      // console.log(editId);
      setDrawerOpen1(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      const payload = { 19: formData.id };

      if (formData.contract && formData.contract instanceof File) {
        setUploadProgress(0);
        setIsUploading(true);

        const uploadRes = await uploadFileViaRpc(
          stRef,
          formData.contract,
          null,
          (p) => {
            setUploadProgress(p);
            if (p === 100) setIsUploading(false);
          },
        );

        formData.contract = uploadRes.fileId;
      }
      if (formData.permLetter && formData.permLetter instanceof File) {
        setUploadProgress(0);
        setIsUploading(true);

        const uploadRes = await uploadFileViaRpc(
          stRef,
          formData.permLetter,
          null,
          (p) => {
            setUploadProgress(p);
            if (p === 100) setIsUploading(false);
          },
        );

        formData.permLetter = uploadRes.fileId;
      }
      if (formData.consentLetter && formData.consentLetter instanceof File) {
        setUploadProgress(0);
        setIsUploading(true);

        const uploadRes = await uploadFileViaRpc(
          stRef,
          formData.consentLetter,
          null,
          (p) => {
            setUploadProgress(p);
            if (p === 100) setIsUploading(false);
          },
        );

        formData.consentLetter = uploadRes.fileId;
      }

      // console.log(formData)
      // return

      const fieldMap = {
        orgName: 1.1,
        orgId: 1.2,
        orgTypeId: 1.3,
        ordName: 1.4,
        ordPrice: 1.9,
        contractNumber: 1.7,
        contractDate: 2.2,
        contractPriceDate: 2.3,
        resPer: 1.6,
        contract: 2.5,
        controllers: 2.6,
        orgType: 1.7,
        workers: 2.8,
        ordEndDate: 2.4,
        permLetter: 6.3,
        consentLetter: 6.1,
      };

      const updatedFieldCodes = [];

      Object.keys(fieldMap).forEach((key) => {
        if (formData[key] !== editItemOld[key]) {
          const code = fieldMap[key];
          // console.log(code);
          if (code == 6.3 || code == 6.1) {
            payload[code] = {
              1: formData[key],
              2: fileName,
            };
            // console.log(payload)
          } else if (key === "department" || key === "role") {
            payload[code] = parseInt(formData[key]);
          } else {
            payload[code] = formData[key];
          }

          updatedFieldCodes.push(code);
        }
      });

      // console.log(payload)
      // return

      if (updatedFieldCodes.length === 0) {
        toast.error("Hech qanday o'zgarish qilinmadi");
        return;
      }

      // console.log("Payload:", payload);
      const res = await sendRpcRequest(stRef, METHOD.ORDER_UPDATE, payload);
      // console.log(res);

      if (res.status === METHOD.OK) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === formData.id ? { ...item, ...formData } : item,
          ),
        );
        setExpertize((prev) =>
          prev.map((item) =>
            item.id === formData.id
              ? {
                  ...item,
                  orgName: formData.orgName,
                  orgUuid: formData.orgId,
                  shortName: formData.ordName,
                  inn: formData.ordPrice,
                  number: formData.contractNumber,
                  contractDate: formData.contractDate,
                  startDate: formData.contractPriceDate,
                  endDate: formData.ordEndDate,
                  director: formData.resPer,
                  controllers: formData.controllers,
                  workers: formData.workers,
                  orgType: formData.orgType,
                }
              : item,
          ),
        );

        setChangedFields([]);

        setEditItemOld({ ...formData });

        toast.success("Foydalanuvchi muvaffaqiyatli yangilandi");
      } else {
        toast.error("Xatolik: Server ma'lumotni qabul qilmadi");
      }
    } catch (err) {
      // console.error("Update Error:", err);
      toast.error("Foydalanuvchi yangilanmadi, tizim xatosi");
    }
  };

  const handleNewCreate = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
    } catch (error) {
      console.log("");
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const handleNextPage = async (id) => {
    try {
      const newData = await getAllExpertize(
        id,
        true,
        selectedStatusId,
        debouncedSearchTerm || null,
      );
      if (newData) {
        setExpertize(newData);
        setJustPage(justPage + 1);
      }
    } catch (error) {
      console.error("Next Page Error:", error);
    }
  };

  const handleBackPage = async (id) => {
    try {
      const newData = await getAllExpertize(
        id,
        false,
        selectedStatusId,
        debouncedSearchTerm || null,
      );
      if (newData) {
        setExpertize(newData);
        setJustPage(justPage - 1);
      }
    } catch (error) {
      console.error("Back Page Error:", error);
    }
  };

  const handleStatusCardClick = (cardId) => {
    setSelectedStatusId(cardId);
    setJustPage(0);
  };

  const getUser = (item) => {
    if (!item || !Array.isArray(item)) return [];

    return item.map((user) => ({
      value: user.id,
      label: `${user.surname} ${user.name}`,
      count: user.count,
    }));
  };

  const formatUserOption = (option, { context }) => {
    if (context === "value") {
      return <span>{option.label}</span>;
    }
    return (
      <div className="flex justify-between items-center w-full">
        <span>{option.label}</span>
        <span className="text-gray-500">{option.count}</span>
      </div>
    );
  };

  const handleControllerChange = (selectedOptions) => {
    const formattedControllers = selectedOptions
      ? selectedOptions.map((option) => ({
          a1: option.value,
          a2: option.label,
          a3: 1,
        }))
      : [];
    setFormData((prev) => ({
      ...prev,
      controllers: formattedControllers,
    }));
    // console.log(formattedControllers);
    markFieldChanged(
      5.1,
      JSON.stringify(formattedControllers),
      JSON.stringify(editItemOld.controllers || []),
    );
  };

  const handleWorkersChange = (selectedOptions) => {
    const formattedControllers = selectedOptions
      ? selectedOptions.map((option) => ({
          a1: option.value,
          a2: option.label,
          a3: 2,
        }))
      : [];
    setFormData((prev) => ({
      ...prev,
      workers: formattedControllers,
    }));
    markFieldChanged(
      5.3,
      JSON.stringify(formattedControllers),
      JSON.stringify(editItemOld.workers || []),
    );
  };

  const getExpertizeCount = async () => {
    try {
      const res = await sendRpcRequest(stRef, METHOD.ORDER_GET_COUNT, { 3: 1 });
      // console.log(res);
      if (res.status === METHOD.OK) {
        const totalCount = res[1]?.reduce(
          (sum, item) => sum + (item.count || 0),
          0,
        );

        const allCount = res[1]?.map((item) => {
          return { id: item._id, count: item.count || 0 };
        });
        setCount(totalCount);
        setStatusCount(allCount);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getExpertizeCount();
  }, []);

  return (
    <>
      {drawerOpen && (
        <div onClick={closeDrawer} className="fixed inset-0 bg-black/40 z-40" />
      )}
      {drawerOpen1 && (
        <div
          onClick={closeDrawer1}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}
      {/* test */}
      <div
        className={`expertise-drawer fixed top-0 right-0 h-full w-[700px] pr-[30px] bg-white dark:bg-[#2b2c40] z-50 transform transition-transform duration-300
        ${drawerOpen1 ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-500">Yangilash</h2>
          <button onClick={closeDrawer1} className="text-xl">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 items-start">
            <div className="relative w-full flex-1">
              <div className="mb-4">
                <label className="text-sm text-gray-500 uppercase">
                  Ekspertiza uchun zaruriy chora-tadbirlar tashkil etilgan sana
                </label>
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  onChange={(newValue) => {
                    const nextValue =
                      newValue && newValue.isValid()
                        ? newValue.toISOString()
                        : "";
                    setFormData((prev) => ({
                      ...prev,
                      startDate: nextValue,
                    }));
                    markFieldChanged(4.7, nextValue, editItemOld.startDate);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "mt-6 border rounded-md bg-transparent ",
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            {formData.startDate && (
              <button
                type="button"
                onClick={saveStartDate}
                disabled={savingField === "startDate"}
                className="mt-10 p-2  text-[#bb9769]  border-r rounded-full disabled:opacity-60"
                title="Sanani saqlash"
              >
                {savingField === "startDate" ? (
                  <span className="text-sm">...</span>
                ) : (
                  <SaveIcon sx={{ fontSize: 22 }} />
                )}
              </button>
            )}
          </div>

          {/* Boshlang'ich hash: fayl tanlanganda save icon */}
          <div className="space-y-4 mt-6">
            <div className="w-full flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-500 uppercase block mb-2">
                  BOSHLANG'ICH HASH QIYMATI
                </label>
                <label
                  htmlFor="initial-hash-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                  onDragOver={handleHashDragOver}
                  onDrop={(e) => handleHashDrop("initial", e)}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 48, color: "#696cff", mb: 1 }}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                    Faylni shu maydonga tashlang yoki maydonni bosing
                  </span>
                  {formData.initialHashFile && (
                    <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {formData.initialHashFile.name}
                    </span>
                  )}
                  <input
                    id="initial-hash-file"
                    type="file"
                    className="hidden"
                    onChange={handleInitialHashFileChange}
                  />
                </label>
              </div>
              {formData.initialHashFile && (
                <button
                  type="button"
                  onClick={saveInitialHashFile}
                  disabled={savingField === "initialHash"}
                  className="mt-10 p-2  text-[#bb9769]  border-r rounded-full disabled:opacity-60"
                  title="Boshlang'ich hash faylini saqlash"
                >
                  {savingField === "initialHash" ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <SaveIcon sx={{ fontSize: 22 }} />
                  )}
                </button>
              )}
            </div>
            <div className="w-full flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-500 uppercase block mb-2">
                  YAKUNIY HASH QIYMATI
                </label>
                <label
                  htmlFor="final-hash-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                  onDragOver={handleHashDragOver}
                  onDrop={(e) => handleHashDrop("final", e)}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 48, color: "#696cff", mb: 1 }}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                    Faylni shu maydonga tashlang yoki maydonni bosing
                  </span>
                  {formData.finalHashFile && (
                    <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {formData.finalHashFile.name}
                    </span>
                  )}
                  <input
                    id="final-hash-file"
                    type="file"
                    className="hidden"
                    onChange={handleFinalHashFileChange}
                  />
                </label>
              </div>
              {formData.finalHashFile && (
                <button
                  type="button"
                  onClick={saveFinalHashFile}
                  disabled={savingField === "finalHash"}
                  className="mt-10 p-2  text-[#bb9769]  border-r rounded-full disabled:opacity-60"
                  title="Yakuniy hash faylini saqlash"
                >
                  {savingField === "finalHash" ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <SaveIcon sx={{ fontSize: 22 }} />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={closeDrawer1}
              className="bg-gray-200 dark:bg-gray-400 px-4 py-2 rounded-md"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
      {/* test */}
      <div
        className={`expertise-drawer fixed top-0 right-0 h-full w-[700px] pr-[30px] bg-white dark:bg-[#2b2c40] z-50 transform transition-transform duration-300
        ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-500">
            Tizim qo'shish
          </h2>
          <button onClick={closeDrawer} className="text-xl">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]">
              {isUpdate && !changedFields.includes(4.1) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("orgName")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Tashkilot nomi
              </label>
              <input
                type="text"
                id="orgName"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Tashkilotni kiriting"
              />
              {changedFields.includes(4.1) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
            <div className="relative w-[48%] ml-[20px]">
              {isUpdate && !changedFields.includes(4.2) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("orgId")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Tashkilot idis
              </label>
              <input
                type="text"
                id="orgId"
                name="orgId"
                value={formData.orgId}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Tashkilot"
              />
              {changedFields.includes(4.2) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]">
              {isUpdate && !changedFields.includes(4.3) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("orgTypeId")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                OrgTpeId
              </label>
              <input
                type="text"
                id="orgTypeId"
                name="orgTypeId"
                value={formData.orgTypeId}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Tashkilot turini kiriting"
              />
              {changedFields.includes(4.3) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>{" "}
            <div className="relative w-[48%] ml-[20px]">
              {isUpdate && !changedFields.includes(4.4) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("ordName")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Tizim nomi
              </label>
              <input
                type="text"
                id="ordName"
                name="ordName"
                value={formData.ordName}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Tizim nomini kiriting"
              />
              {changedFields.includes(4.4) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]">
              {isUpdate && !changedFields.includes(4.5) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("ordPrice")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Buyurtma narxi
              </label>
              <input
                type="text"
                id="ordPrice"
                name="ordPrice"
                value={formData.ordPrice}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Buyurtma narxi"
              />
              {changedFields.includes(4.5) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
            <div className="relative w-[48%] ml-[20px]">
              {isUpdate && !changedFields.includes(4.6) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("contractNumber")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Shartnoma raqami
              </label>
              <input
                type="text"
                id="contractNumber"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="Shartnoma raqami"
              />
              {changedFields.includes(4.6) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%] flex flex-col justify-end">
              {isUpdate && !changedFields.includes(4.9) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => {
                    document.getElementById("contract-file")?.click();
                  }}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase mb-1">
                Shartnoma
              </label>

              <Button
                component="label"
                variant="outlined"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{
                  height: "42px",
                  width: "100%",
                  borderColor: "rgba(0, 0, 0, 0.23)",
                  color: "#566a7f",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#696cff",
                  },
                }}
              >
                {fileName || "Faylni tanlang"}
                <input
                  type="file"
                  hidden
                  id="contract-file"
                  name="contract"
                  onChange={(e) => {
                    handleFileChange(e);
                  }}
                />
              </Button>
              {changedFields.includes(4.9) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
            <div
              className="relative w-[48%] ml-[20px]"
              data-field="contractDate"
            >
              {isUpdate && !changedFields.includes(4.7) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("contractDate")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Shartnoma sanasi
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  value={
                    formData.contractDate ? dayjs(formData.contractDate) : null
                  }
                  onChange={(newValue) => {
                    const nextValue =
                      newValue && newValue.isValid()
                        ? newValue.toISOString()
                        : "";
                    setFormData((prev) => ({
                      ...prev,
                      contractDate: nextValue,
                    }));
                    markFieldChanged(4.7, nextValue, editItemOld.contractDate);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "mt-1 border rounded-md bg-transparent",
                    },
                  }}
                />
              </LocalizationProvider>
              {changedFields.includes(4.7) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]" data-field="contractPriceDate">
              {isUpdate && !changedFields.includes(4.8) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("contractPriceDate")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                To'lov sanasi
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  value={
                    formData.contractPriceDate
                      ? dayjs(formData.contractPriceDate)
                      : null
                  }
                  onChange={(newValue) => {
                    const nextValue =
                      newValue && newValue.isValid()
                        ? newValue.toISOString()
                        : "";
                    setFormData((prev) => ({
                      ...prev,
                      contractPriceDate: nextValue,
                    }));
                    markFieldChanged(
                      4.8,
                      nextValue,
                      editItemOld.contractPriceDate,
                    );
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "mt-1 border rounded-md bg-transparent",
                    },
                  }}
                />
              </LocalizationProvider>
              {changedFields.includes(4.8) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
            <div className="relative w-[48%] ml-[20px]">
              {isUpdate && !changedFields.includes(5) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("resPer")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Biriktirilgan shaxs
              </label>
              <input
                type="text"
                id="resPer"
                name="resPer"
                value={formData.resPer}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                placeholder="F.I.SH"
              />
              {changedFields.includes(5) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]" data-field="controllers">
              {isUpdate && !changedFields.includes(5.1) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("controllers")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Nazoratchini tanlang
              </label>

              <Select
                isMulti
                name="controllers"
                options={getUser(items)}
                className="basic-multi-select"
                formatOptionLabel={formatUserOption}
                classNamePrefix="select"
                placeholder="Nazoratchini tanlang..."
                onChange={handleControllerChange}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "transparent",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.375rem",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
              {changedFields.includes(5.1) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>

            <div className="relative w-[48%] ml-[20px]" data-field="workers">
              {isUpdate && !changedFields.includes(5.3) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("workers")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Bajaruvchini tanlang
              </label>
              <Select
                isMulti
                name="workers"
                options={getUser(items)}
                className="basic-multi-select"
                classNamePrefix="select"
                formatOptionLabel={formatUserOption}
                placeholder="Bajaruvchini tanlang..."
                onChange={handleWorkersChange}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "transparent",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.375rem",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
              {changedFields.includes(5.3) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <div className="relative w-[48%]" data-field="orgType">
              {isUpdate && !changedFields.includes(5.2) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("orgType")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Tashkilot turi
              </label>
              <select
                id="orgType"
                name="orgType"
                value={formData.orgType}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
              >
                <option value="">Tanlang</option>
                {orgTypes.map((item, index) => {
                  return (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  );
                })}
              </select>
              {changedFields.includes(5.2) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>

            <div className="relative w-[48%] ml-[20px]" data-field="ordEndDate">
              {isUpdate && !changedFields.includes(5.4) && (
                <button
                  type="button"
                  className="field-action-btn edit"
                  onClick={() => focusField("ordEndDate")}
                >
                  <iconify-icon icon="ri:edit-2-line" />
                </button>
              )}
              <label className="text-sm text-gray-500 uppercase">
                Tugash sanasi
              </label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  value={
                    formData.ordEndDate ? dayjs(formData.ordEndDate) : null
                  }
                  onChange={(newValue) => {
                    const nextValue =
                      newValue && newValue.isValid()
                        ? newValue.toISOString()
                        : "";
                    setFormData((prev) => ({
                      ...prev,
                      ordEndDate: nextValue,
                    }));
                    markFieldChanged(5.4, nextValue, editItemOld.ordEndDate);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "mt-1 border rounded-md bg-transparent",
                    },
                  }}
                />
              </LocalizationProvider>{" "}
              {changedFields.includes(5.4) && (
                <button
                  onClick={handleUpdate}
                  type="button"
                  className="field-action-btn save"
                >
                  <iconify-icon icon="material-symbols:save-outline" />
                </button>
              )}
            </div>
          </div>

          {isUpdate && (
            <>
              <div className="relative flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-sm text-gray-500 uppercase">
                    Jarayonni tanlang
                  </label>
                  <select
                    id="processStep"
                    value={selectedProcessStep}
                    onChange={(e) => setSelectedProcessStep(e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                  >
                    <option value="">Jarayonni tanlang</option>
                    <option value="1">Shartnoma kelgan</option>
                    <option value="2">Tizimga qo'shilgan</option>
                    <option value="3">Xat chiqarilgan</option>
                    <option value="4">Xat kelgan</option>
                    <option value="5">Jarayonda</option>
                    <option value="6">Hisobotga chiqarilgan</option>
                    <option value="7">Qisman yakunlangan</option>
                    <option value="8">Qayta ekspertiza</option>
                    <option value="9">To'liq yakunlangan</option>
                    <option value="10">Vaqtincha to'xtatilgan</option>
                  </select>
                </div>
                {selectedProcessStep &&
                  selectedProcessStep !== savedProcessStepStatus && (
                    <button
                      type="button"
                      onClick={handleSaveProcessStepStatus}
                      className="field-action-btn save"
                      title="Statusni saqlash"
                    >
                      <iconify-icon icon="material-symbols:save-outline" />
                    </button>
                  )}
              </div>

              {selectedProcessStep === "3" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.5)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase mb-1">
                        Fayl
                      </label>
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          height: "42px",
                          width: "100%",
                          borderColor: "rgba(0, 0, 0, 0.23)",
                          color: "#566a7f",
                          textTransform: "none",
                          "&:hover": { borderColor: "#696cff" },
                        }}
                      >
                        {processStepFileName || "Faylni tanlang"}
                        <input
                          type="file"
                          hidden
                          onChange={handleProcessStepFileChange}
                        />
                      </Button>
                    </div>
                    {(processStepFile || processStepFileName) &&
                      processStepFileName !== savedProcessStepFileName && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepFile(6.2)}
                          className="field-action-btn save"
                          title="Faylni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "4" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.6)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase mb-1">
                        Fayl
                      </label>
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          height: "42px",
                          width: "100%",
                          borderColor: "rgba(0, 0, 0, 0.23)",
                          color: "#566a7f",
                          textTransform: "none",
                          "&:hover": { borderColor: "#696cff" },
                        }}
                      >
                        {processStepFileName || "Faylni tanlang"}
                        <input
                          type="file"
                          hidden
                          onChange={handleProcessStepFileChange}
                        />
                      </Button>
                    </div>
                    {(processStepFile || processStepFileName) &&
                      processStepFileName !== savedProcessStepFileName && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepFile(6.3)}
                          className="field-action-btn save"
                          title="Faylni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "6" && (
                <div className="mt-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.1)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "7" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.11)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Ma'lumot
                      </label>
                      <input
                        type="text"
                        value={processStepNote}
                        onChange={(e) => setProcessStepNote(e.target.value)}
                        className="w-full mt-1 px-4 py-2 border rounded-md bg-transparent"
                        placeholder="Ma'lumot yozing"
                      />
                    </div>
                    {processStepNote?.trim() &&
                      processStepNote.trim() !== savedProcessStepNote && (
                        <button
                          type="button"
                          onClick={handleSaveProcessStepNote}
                          className="field-action-btn save"
                          title="Ma'lumotni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "8" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.12)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase mb-1">
                        Fayl
                      </label>
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          height: "42px",
                          width: "100%",
                          borderColor: "rgba(0, 0, 0, 0.23)",
                          color: "#566a7f",
                          textTransform: "none",
                          "&:hover": { borderColor: "#696cff" },
                        }}
                      >
                        {processStepFileName || "Faylni tanlang"}
                        <input
                          type="file"
                          hidden
                          onChange={handleProcessStepFileChange}
                        />
                      </Button>
                    </div>
                    {(processStepFile || processStepFileName) &&
                      processStepFileName !== savedProcessStepFileName && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepFile(6.6)}
                          className="field-action-btn save"
                          title="Faylni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "9" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.13)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase mb-1">
                        Fayl
                      </label>
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          height: "42px",
                          width: "100%",
                          borderColor: "rgba(0, 0, 0, 0.23)",
                          color: "#566a7f",
                          textTransform: "none",
                          "&:hover": { borderColor: "#696cff" },
                        }}
                      >
                        {processStepFileName || "Faylni tanlang"}
                        <input
                          type="file"
                          hidden
                          onChange={handleProcessStepFileChange}
                        />
                      </Button>
                    </div>
                    {(processStepFile || processStepFileName) &&
                      processStepFileName !== savedProcessStepFileName && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepFile(6.7)}
                          className="field-action-btn save"
                          title="Faylni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedProcessStep === "10" && (
                <div className="mt-4 space-y-4">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase">
                        Sana
                      </label>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                          value={
                            processStepDate ? dayjs(processStepDate) : null
                          }
                          onChange={(newValue) => {
                            setProcessStepDate(
                              newValue && newValue.isValid()
                                ? newValue.toISOString()
                                : null,
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              className:
                                "mt-1 border rounded-md bg-transparent",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                    {processStepDate &&
                      processStepDate !== savedProcessStepDate && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepDate(2.9)}
                          className="field-action-btn save"
                          title="Sanani saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 uppercase mb-1">
                        Fayl
                      </label>
                      <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          height: "42px",
                          width: "100%",
                          borderColor: "rgba(0, 0, 0, 0.23)",
                          color: "#566a7f",
                          textTransform: "none",
                          "&:hover": { borderColor: "#696cff" },
                        }}
                      >
                        {processStepFileName || "Faylni tanlang"}
                        <input
                          type="file"
                          hidden
                          onChange={handleProcessStepFileChange}
                        />
                      </Button>
                    </div>
                    {(processStepFile || processStepFileName) &&
                      processStepFileName !== savedProcessStepFileName && (
                        <button
                          type="button"
                          onClick={() => handleSaveProcessStepFile(6.5)}
                          className="field-action-btn save"
                          title="Faylni saqlash"
                        >
                          <iconify-icon icon="material-symbols:save-outline" />
                        </button>
                      )}
                  </div>
                </div>
              )}
            </>
          )}

          {!isUpdate && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreate}
                className="bg-[#696cff] text-white px-4 py-2 rounded-md"
              >
                Yaratish
              </button>
              <button
                onClick={closeDrawer}
                className="bg-gray-200 dark:bg-gray-400 px-4 py-2 rounded-md"
              >
                Bekor qilish
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-page" style={{ margin: "-20px" }}>
        <Section
          title="Tizim ekspertizalar"
          items={system}
          selectedStatusId={selectedStatusId}
          onCardClick={handleStatusCardClick}
        />
        <div className="mt-10">
          <div className="bg-white rounded-md shadow-sm pb-20 dark:bg-[#2b2c40]">
            <div className="mb-6 px-6 pt-6">
              <h4 className="text-sm text-slate-400 font-medium">
                Qidiruv filter
              </h4>
              <div className="mt-3 flex items-center gap-4">
                <select className="h-10 w-64 rounded-lg border border-slate-200 bg-white dark:bg-transparent px-4 text-[14px] text-slate-500 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200">
                  <option>Foydalanuvchini tanlang ...</option>
                </select>
                <div className="ml-auto flex items-center">
                  <div className="relative">
                    <input
                      className="h-10 w-64 rounded-lg border border-slate-200 bg-white dark:bg-transparent px-4 pr-10 text-[14px] text-slate-500 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                      placeholder="Qidiruv..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute right-2 top-[24px] -translate-y-1/2 text-slate-400">
                      <iconify-icon
                        icon="mdi:magnify"
                        width="18"
                        height="18"
                      ></iconify-icon>
                    </span>
                  </div>
                  {user.role === 1 && (
                    <button
                      className="ml-4 inline-flex items-center gap-2 rounded-md bg-[#696cff] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#565edc] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#696cff]/50 active:translate-y-0"
                      onClick={openDrawer}
                    >
                      Tizim qo'shish
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[13px] uppercase border-b border-slate-200 dark:bg-transparent">
                    <th className="px-4 py-3 font-medium">N</th>
                    <th className="px-4 py-3 font-medium">TASHKILOT NOMI</th>
                    <th className="px-4 py-3 font-medium text-wrap max-w-[250px]">
                      AXBOROT TIZIMINING NOMI
                    </th>
                    <th className="px-4 py-3 font-medium">SHARTNOMA RAQAMI</th>
                    <th className="px-4 py-3 font-medium">NAZORATCHI</th>
                    <th className="px-4 py-3 font-medium">BAJARUVCHI</th>
                    <th className="px-4 py-3 font-medium text-wrap w-[200px]">
                      EKSPERTIZANING BOSHLANISH SANASI
                    </th>
                    <th className="px-4 py-3 font-medium text-wrap w-[200px]">
                      EKSPERTIZANING YAKUNLANISH SANASI
                    </th>
                    <th className="px-4 py-3 font-medium text-wrap">
                      HISOB MA'LUMOTI
                    </th>
                    <th className="px-4 py-3 font-medium text-wrap">BALL</th>
                    <th className="px-4 py-3 font-medium">QAYSI BOSQICHDA</th>
                    <th className="px-4 py-3 font-medium">HOLATLAR</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems?.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 align-middle hover:bg-slate-50 dark:hover:bg-[#2b2c40]"
                    >
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 dark:text-white">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 text-center dark:text-white">
                        {r.orgName}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 text-center max-w-[250px] whitespace-normal break-words dark:text-white">
                        {r.shortName}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 text-center dark:text-white  ">
                        {r.number}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 dark:text-white">
                        {r?.controllers?.map((b, idx) => (
                          <span className="block mb-1" key={idx}>
                            {b.a2}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-pre-line text-[15px] text-slate-600 dark:text-white">
                        {r?.workers?.map((b, idx) => (
                          <span className="block mb-1" key={idx}>
                            {b.a2}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 w-[200px] dark:text-white text-center">
                        {formatDate(r.startDate)}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-slate-600 text-center w-[200px] dark:text-white">
                        {formatDate(r.endDate)}
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <span
                          className={`inline-block px-3 py-1 text-[12px] rounded-full ${
                            r.hisobot
                              ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-100"
                              : "bg-red-100 dark:bg-red-500 text-red-600 dark:text-red-50"
                          }`}
                        >
                          {r.hisobot || "Chiqarilmagan"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-center text-slate-600 dark:text-white">
                        {r.ball || "0/15"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="h-full flex relative">
                          {STATUS_STEPS.map((step, index) => {
                            const isActive = r.status >= step.id;
                            const stepBgClass = !isActive
                              ? "status-step-inactive"
                              : "status-step-active";
                            const stepStyle =
                              step.id > r.status
                                ? { background: "linear-gradient(145deg, #9ca3af, #6b7280)" }
                                : r.status === 10 && step.id === 10
                                  ? { background: "linear-gradient(145deg, #dc2626, #b91c1c)" }
                                  : r.status === 9 && step.id === 9
                                    ? { background: "linear-gradient(145deg, #16a34a, #15803d)" }
                                    : r.status >= step.id && (r.status === 9 || r.status === 10)
                                      ? { background: "linear-gradient(145deg, #2563eb, #1d4ed8)" }
                                      : undefined;

                            return (
                              <div
                                key={step.id}
                                className="relative group status-step-group"
                                style={{
                                  marginLeft: index === 0 ? 0 : 1,
                                  zIndex: index,
                                }}
                              >
                                <span
                                  className={`status-step w-7 h-7 cursor-pointer rounded-full border border-white dark:border-[#2b2c40] ${stepBgClass} flex items-center justify-center`}
                                  style={stepStyle}
                                >
                                  <span className="text-[10px] text-white font-bold">
                                    {step.id}
                                  </span>
                                </span>

                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 text-sm text-white bg-black rounded opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-[100]">
                                  {step.label}
                                  <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-black rotate-45 -translate-x-1/2"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          {user.role === 1 || user.role === 3 ? (
                            <button
                              className="p-2 rounded-md hover:bg-blue-500 hover:text-white bg-blue-400 text-white"
                              onClick={() => handleEdit(r)}
                            >
                              <iconify-icon
                                icon="tabler:edit"
                                width="20"
                                height="20"
                              ></iconify-icon>
                            </button>
                          ) : (
                            <button
                              className="p-2 rounded-md hover:bg-blue-500 hover:text-white bg-blue-400 text-white"
                              onClick={() => handleNextStep(r)}
                            >
                              <iconify-icon
                                icon="tabler:edit"
                                width="20"
                                height="20"
                              ></iconify-icon>
                            </button>
                          )}

                          <button
                            className="p-2 rounded-md bg-slate-200 text-slate-500 hover:bg-slate-400 hover:text-white"
                            onClick={() => handleModal(r.id)}
                          >
                            <iconify-icon
                              icon="mdi:dots-vertical"
                              width="20"
                              height="20"
                            ></iconify-icon>
                          </button>
                          {r.status === 5 &&
                            (r.workers || []).some(
                              (w) => String(w.a1) === String(user?.id),
                            ) &&
                            (r.sU === 2 ? (
                              <span className="ml-2 px-4 py-2 rounded-full border-2 border-slate-300 bg-slate-100 text-slate-500 text-sm font-medium dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-400">
                                Tekshirilmoqda
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ml-2 px-4 py-2 rounded-full border-2 border-cyan-500 bg-white text-cyan-500 text-sm font-medium hover:bg-cyan-50 transition-colors dark:bg-transparent dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-500/10"
                                onClick={() => handleTekshirtirish(r.id)}
                              >
                                Tekshirtirish
                              </button>
                            ))}
                          {r.status === 5 &&
                            (r.controllers || []).some(
                              (c) => String(c.a1) === String(user?.id),
                            ) &&
                            (r.sU === 2 ? (
                              <div className="flex justify-center gap-3">
                                <button
                                  className="ml-2 px-4 py-2 rounded-full border-2 border-red-500 bg-white text-red-500 text-sm font-medium hover:bg-red-50 transition-colors dark:bg-transparent dark:text-red-400 dark:border-red-400 dark:hover:bg-cyan-500/10"
                                  onClick={() => handleBackExp(r.id)}
                                  type="button"
                                >
                                  Qaytarish
                                </button>
                                <button
                                  className="ml-2 px-4 py-2 rounded-full border-2 border-cyan-500 bg-white text-cyan-500 text-sm font-medium hover:bg-cyan-50 transition-colors dark:bg-transparent dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-500/10"
                                  onClick={() => handleNextExp(r.id)}
                                  type="button"
                                >
                                  Tasdiqlash
                                </button>
                              </div>
                            ) : (
                              <></>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalItems > 0 && (
                <div className="px-6 py-4 flex items-center justify-between border-t dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {totalItems > 0
                      ? `${startIndex + 1}–${Math.min(endIndex, totalItems)} / ${totalItems}`
                      : "Ma'lumot yo'q"}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={justPage == 0}
                      onClick={
                        () => handleBackPage(isPage)
                        // setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      // disabled={currentPage === 1}
                      className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      Oldingi
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium">
                      {justPage + 1}
                    </span>
                    <button
                      onClick={
                        () => handleNextPage(isPage)
                        // setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={nextPage == null}
                      className="px-3 py-1.5 border rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                    >
                      Keyingi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <button
            className="mt-4 px-[10px] pt-[10px] bg-gray-50 text-gray-700 rounded absolute top-[30px] right-[13px] shadow-md"
            onClick={handleModal}
          >
            <iconify-icon
              icon="mdi:close"
              width="28"
              height="28"
            ></iconify-icon>
          </button>
          <div className="bg-white dark:bg-[#2b2c40] rounded-lg shadow-lg p-6 w-[55%] relative overflow-y-scroll max-h-[100vh]">
            <h2 className="text-lg font-semibold mb-4 text-gray-500 dark:text-gray-200">
              Batafsil
            </h2>
            <ExpertizaTable expData={signleExp} link="/system-doc" />
          </div>
        </div>
      )}
    </>
  );
};

export default Expertise;
