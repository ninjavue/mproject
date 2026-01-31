import React from "react";
import { Link } from "react-router-dom";
import { renderAsync } from "docx-preview";
import html2canvas from "html2canvas";
import { useReactToPrint } from "react-to-print";

import { useZirhStref } from "../../context/ZirhContext";
import { downloadFileViaRpcNew } from "../../rpc/fileRpc";

const CellValue = ({
  text,
  badge,
  download,
  button,
  linkToWord,
  url,
  onOpen,
}) => {
  return (
    <>
      {url ? (
        <div
          className="flex items-center gap-2 font-bold text-gray-500"
          onClick={() => onOpen?.(url, text)}
        >
          {text}
          {badge && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {badge}
            </span>
          )}

          {download && (
            <iconify-icon
              icon="mdi:download"
              width={18}
              className="cursor-pointer text-gray-500 hover:text-blue-600"
            />
          )}

          {button &&
            (linkToWord ? (
              <Link
                to={`/page/${linkToWord}`}
                className="rounded bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 text-[15px]"
              >
                {button}
              </Link>
            ) : (
              <button className="rounded bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 text-[15px]">
                {button}
              </button>
            ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 font-bold text-gray-500">
          {text}

          {badge && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {badge}
            </span>
          )}

          {download && (
            <iconify-icon
              icon="mdi:download"
              width={18}
              className="cursor-pointer text-gray-500 hover:text-blue-600"
            />
          )}

          {button &&
            (linkToWord ? (
              <Link
                to={`/page/${linkToWord}`}
                className="rounded bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 text-[15px]"
              >
                {button}
              </Link>
            ) : (
              <button className="rounded bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 text-[15px]">
                {button}
              </button>
            ))}
        </div>
      )}
    </>
  );
};

const Row4 = ({ label1, value1, label2, value2 }) => (
  <div
    className={`grid grid-cols-4 border-b text-sm ${label1 === "Tashkilot nomi" ? "border-t" : ""}`}
  >
    <div className="px-4 py-6 text-gray-500 border-r border-l text-[15px]">
      {label1}
    </div>
    <div className="px-4 py-6 border-r text-gray-700 font-bold text-[15px] text-center">
      {value1}
    </div>
    <div className="px-4 py-6 text-gray-500 border-r text-[15px]">{label2}</div>
    <div className="px-4 py-6 border-r text-gray-700 font-bold text-[15px] text-center">
      {value2}
    </div>
  </div>
);

const ExpertizaTable = ({ expData, link = "word" }) => {
  const { stRef } = useZirhStref();
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [wordBlob, setWordBlob] = React.useState(null);
  const [wordError, setWordError] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const docxContainerRef = React.useRef(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [printImages, setPrintImages] = React.useState([]);
  const printComponentRef = React.useRef(null);

  const handleReactToPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: "Hujjat",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const openDoc = async (url, name) => {
    const blob = await downloadFileAll(url);
    const fileName = (name || "").toLowerCase();
    const mime = blob.type || "";

    if (mime === "application/pdf" || fileName.endsWith(".pdf")) {
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      setWordBlob(null);
      setWordError(null);
      setOpen(true);
      return;
    }

    if (
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc") ||
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      mime === "application/octet-stream"
    ) {
      setPreviewUrl(null);
      setWordBlob(blob);
      setWordError(null);
      setOpen(true);
      return;
    }

    alert("Fayl turi aniqlanmadi");
  };

  const downloadFileAll = async (id) => {
    const blob = await downloadFileViaRpcNew(
      stRef,
      id,
      expData?.files[0]?.[2],
      (p) => {
        console.log(p);
        setUploadProgress(p);
        setIsUploading(true);
        if (p === 100) setIsUploading(false);
      },
    );

    return blob;
  };

  const closeModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setWordBlob(null);
    setWordError(null);
    setOpen(false);
  };

  React.useEffect(() => {
    const renderDocx = async () => {
      if (!wordBlob || !docxContainerRef.current) return;
      try {
        const buffer = await wordBlob.arrayBuffer();
        docxContainerRef.current.innerHTML = "";
        await renderAsync(buffer, docxContainerRef.current, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: true,
        });
      } catch (e) {
        console.error("docx render err", e);
        setWordError(
          "Word faylini ochishda xatolik. Iltimos .docx formatida yuboring.",
        );
      }
    };
    renderDocx();
  }, [wordBlob]);

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      if (previewUrl) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = previewUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            setIsPrinting(false);
          }, 1000);
        };
        return;
      }

      if (docxContainerRef.current) {
        const container = docxContainerRef.current;
        const sections = container.querySelectorAll("section.docx");
        if (sections.length === 0) {
          setIsPrinting(false);
          return;
        }

        const images = [];
        for (const section of sections) {
          const canvas = await html2canvas(section, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
              const tables = clonedDoc.querySelectorAll("table");
              tables.forEach((table) => {
                table.style.borderCollapse = "collapse";
                table.querySelectorAll("td, th").forEach((cell) => {
                  cell.style.boxSizing = "border-box";
                });
              });
            },
          });
          images.push(canvas.toDataURL("image/png"));
        }

        setPrintImages(images);
        setTimeout(() => {
          handleReactToPrint();
          setIsPrinting(false);
        }, 800);
      }
    } catch (e) {
      console.error("Print error:", e);
      setIsPrinting(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50">
          <div className="absolute top-8 right-[40px] flex gap-4 z-50">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`text-white ${isPrinting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} p-3 rounded-full flex items-center justify-center shadow-lg`}
              title="Chop etish"
            >
              {isPrinting ? (
                <iconify-icon
                  icon="line-md:loading-twotone-loop"
                  width="32"
                />
              ) : (
                <iconify-icon
                  icon="material-symbols:print-outline"
                  width="32"
                />
              )}
            </button>

            <button
              onClick={closeModal}
              className="text-white bg-red-600 hover:bg-red-700 p-3 rounded-full flex items-center justify-center shadow-lg"
            >
              <iconify-icon icon="ic:round-close" width="32" />
            </button>
          </div>
          <div className="docs w-[1000px] h-[100vh] max-w-[1100px] overflow-auto relative">
            {previewUrl && (
              <object
                data={previewUrl + "#toolbar=0&navpanes=0&scrollbar=1"}
                type="application/pdf"
                className="w-full h-full border-none"
                style={{ minHeight: "calc(100vh - 40px)" }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <p>PDF ochishda xatolik yuz berdi.</p>
              </object>
            )}
            {wordBlob && (
              <div className="docx-preview-container">
                {wordError ? (
                  <p className="text-red-500 p-4">{wordError}</p>
                ) : (
                  <div ref={docxContainerRef} />
                )}
              </div>
            )}
            {!previewUrl && !wordBlob && <p>Fayl yuklanmoqda...</p>}
          </div>
        </div>
      )}

      <div className="overflow-hidden bg-white shadow-sm">
        <Row4
          label1="Tashkilot nomi"
          value1={
            <CellValue text={`«${expData?.orgName}» ${expData?.orgType}`} />
          }
          label2="Axborot tizimining nomi"
          value2={<CellValue text={`${expData?.shortName}`} />}
        />

        <Row4
          label1="Nazoratchi"
          value1={
            <CellValue text={`${expData?.controllers["0"].a2}`} badge="0/10" />
          }
          label2="Bajaruvchi"
          value2={
            <CellValue text={`${expData?.workers["0"].a2}`} badge="0/15" />
          }
        />

        <Row4
          label1="Ajratilgan mutaxassislar soni"
          value1={
            <CellValue
              text={`${expData.controllers?.length + expData.workers?.length}`}
            />
          }
          label2="Kelib tushgan xat raqami"
          value2={<CellValue text={expData?.number} />}
        />

        <Row4
          label1="Markaz tomonidan yuborilgan xat"
          value1={
            <CellValue
              text={expData?.files[0]?.[2]}
              url={expData?.files[0]?.[1]}
              download
              onOpen={openDoc}
            />
          }
          label2="Shartnoma imzolangan sana"
          value2={<CellValue text={formatDate(expData?.contractDate)} />}
        />

        <Row4
          label1="Kelib tushgan mablag‘ sanasi"
          value1={<CellValue text={expData?.contractPriceDate} />}
          label2="Tizimga mas’ul shaxs"
          value2={<CellValue text={expData?.director} />}
        />

        <Row4
          label1="Ekspertiza uchun zaruriy chora-tadbirlar tashkil etilgan sana"
          value1={<CellValue text="" />}
          label2="Ekspertizaning boshlanish sanasi"
          value2={<CellValue text={formatDate(expData?.startDate)} />}
        />

        <Row4
          label1="Dasturlash firmasi"
          value1={<CellValue text="Test dasturlash firmasi" />}
          label2="Ekspertiza yakunlanish sanasi"
          value2={<CellValue text={formatDate(expData?.endDate)} />}
        />

        <Row4
          label1="Qaysi bosqichda"
          value1={<CellValue text="Hisobotga chiqarilgan" />}
          label2="Hisobot raqami"
          value2={<CellValue text="234-xdfu-son" />}
        />

        <Row4
          label1="Qayta ekspertizaga yuborilgan sana"
          value1={<CellValue text="" />}
          label2="Qayta ekspertiza natijasi sanasi"
          value2={<CellValue text="" />}
        />

        <Row4
          label1="Xat chiqarilgan"
          value1={<CellValue text="IM43476306.pdf" download />}
          label2="Mobil dastur"
          value2={<CellValue text="" />}
        />

        <Row4
          label1="Xat kelgan"
          value1={<CellValue text="496M.pdf" download />}
          label2="Desktop dastur"
          value2={<CellValue text="" />}
        />

        <Row4
          label1="Rozilik xati"
          value1={<CellValue text="" />}
          label2="Vaqtincha to'xtatilgan"
          value2={<CellValue download />}
        />

        <Row4
          label1="Qayta expertiza"
          value1={<CellValue text="" />}
          label2="To'liq yakunlangan"
          value2={<CellValue text="" />}
        />

        <Row4
          label1="Hisob raqami"
          value1={<CellValue text="" />}
          label2="Summa"
          value2={<CellValue text={expData?.inn.toLocaleString()} />}
        />

        <Row4
          label1="Hisobot yuklab olish"
          value1={<CellValue button="Hisobot" linkToWord={`${link}/${expData?.id}`} />}
          label2="Qayta expertiza ijobiy xat yuklab olish (.docx)"
          value2={<CellValue button="Qayta ijobiy xat" />}
        />

        <Row4
          label1="Qayta expertiza kamchilik xat yuklab olish (.docx)"
          value1={<CellValue button="Qayta kamchilik xat" />}
          label2="Ruxsat xat yuklab olish (.docx)"
          value2={<CellValue button="Ruxsat xat" />}
        />

        <Row4
          label1="To‘liq hisobot"
          value1={<CellValue text="Test(iOS).pdf" download />}
          label2="Dastlabki hash"
          value2={<CellValue text="342-M.rar" download />}
        />

        <Row4
          label1="Yakuniy hash"
          value1={<CellValue button="" />}
          label2=""
          value2={<CellValue button="" />}
        />
      </div>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={printComponentRef}>
          <style>
            {`
              @media print {
                @page { margin: 0; size: A4; }
                .print-page-a4 {
                  width: 210mm;
                  height: 297mm;
                  page-break-after: always;
                  display: flex;
                  justify-content: center;
                  align-items: flex-start;
                  background: white;
                  overflow: hidden;
                }
                .print-page-a4 img {
                  width: 100%;
                  height: auto;
                  max-height: 100%;
                  object-fit: contain;
                }
                .print-page-a4:last-child {
                  page-break-after: auto;
                }
              }
            `}
          </style>
          {printImages.map((img, idx) => (
            <div key={idx} className="print-page-a4">
              <img src={img} alt={`Page ${idx + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ExpertizaTable;
