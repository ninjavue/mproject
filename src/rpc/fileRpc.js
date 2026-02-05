import { sendRpcRequest } from "./rpcClient";
import { METHOD, buildRequestFrame } from "../protocol/zirhRpc.js";
import { sendAppMessage } from "../transport/wsClient.js";


export const uploadFileViaRpc = async (stRef, file, convId, onProgress) => {
  if (!file) return; const allowedExtensions = ["jpg", "jpeg", "png", "pdf", "docx", "zip"];
  const fileExtension = file.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) { throw new Error("Xatolik: .${fileExtension} formatidagi fayllarni yuklash mumkin emas!"); }
  // console.log({name: file.name, size: file.size, mime: file.type || "application/octet-stream", convId,})
  const initRes = await sendRpcRequest(stRef, METHOD.FILE_INIT, { name: file.name, size: file.size, mime: file.type || "application/octet-stream", convId, });
  // console.log(initRes)
  if (!initRes && initRes.status != 56) throw new Error("FILE_INIT failed");
  const { uploadId, chunkSize = 128 * 1024 } = initRes; let offset = 0; let index = 0;
  while (offset < file.size) {
    // console.log("test upload")
    const end = Math.min(offset + chunkSize, file.size); const buf = new Uint8Array(await file.slice(offset, end).arrayBuffer());
    const chunkRes = await sendRpcRequest(stRef, METHOD.FILE_CHUNK, { uploadId, index, offset, data: buf, last: end >= file.size, });
    if (!initRes && initRes.status != 56) throw new Error("FILE_CHUNK failed"); offset = end; index++; if (onProgress) onProgress(Math.round((offset / file.size) * 100));
    // console.log(stRef, METHOD.FILE_DONE, { uploadId, caption: "" })
  } return await sendRpcRequest(stRef, METHOD.FILE_DONE, { uploadId, caption: "" });
};

export const downloadFileViaRpc = async (stRef, fileId, fileName, size, onProgress) => {
  const state = stRef.current;

  // const info = await sendRpcRequest(stRef, METHOD.FILE_INFO, { fileId });
  // if (!info?.status) throw new Error("FILE_INFO failed");

  const  chunkSize = 128 * 1024 
  let offset = 0;
  let allParts = [];

  while (offset < size) {
    const len = Math.min(chunkSize, size - offset);

    const streamRes = await new Promise((resolve, reject) => {
      if (!state.wc || state.phase !== 3) return reject("Offline");

      state.rpcId = (state.rpcId + 1) & 0xffff;
      const rpcId = state.rpcId;

      state.rpcStreams.set(rpcId, {
        resolve,
        reject,
        parts: [],
        totalRead: 0,
        timer: setTimeout(() => reject("Timeout"), 60000),
        onPart: (_, u8, total) => {
          if (onProgress) onProgress(Math.round(((offset + total) / size) * 100));
        },
      });

      const buf = buildRequestFrame(
        rpcId,
        METHOD.FILE_GET_CHUNK,
        { fileId, offset, length: len },
        state.clientId
      );
      const u8 = new Uint8Array(buf);
      

      try {
        state.wc.send_rpc_frame_bytes(rpcId, METHOD.FILE_GET_CHUNK, u8);
      } catch (e) {
        clearTimeout(state.rpcStreams.get(rpcId)?.timer);
        state.rpcStreams.delete(rpcId);
        reject(e);
      }
    });

    allParts.push(...streamRes.parts);
    offset += streamRes.totalRead;
  }

  const blob = new Blob(allParts, { type: mime || "application/octet-stream" });
  const base64 = await blobToBase64(blob);
  localStorage.setItem(fileId, base64);
};



const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });


export const downloadFileViaRpcNew = async (stRef, fileId, fileName, size, onProgress) => {
  const state = stRef.current;

  // const info = await sendRpcRequest(stRef, METHOD.FILE_INFO, { fileId });
  // if (!info?.status) throw new Error("FILE_INFO failed");

  const  chunkSize = 128 * 1024 
  let offset = 0;
  let allParts = [];

  while (offset < size) {
    const len = Math.min(chunkSize, size - offset);

    const streamRes = await new Promise((resolve, reject) => {
      if (!state.wc || state.phase !== 3) return reject("Offline");

      state.rpcId = (state.rpcId + 1) & 0xffff;
      const rpcId = state.rpcId;

      state.rpcStreams.set(rpcId, {
        resolve,
        reject,
        parts: [],
        totalRead: 0,
        timer: setTimeout(() => reject("Timeout"), 60000),
        onPart: (_, u8, total) => {
          if (onProgress) onProgress(Math.round(((offset + total) / size) * 100));
        },
      });

      const buf = buildRequestFrame(
        rpcId,
        METHOD.FILE_GET_CHUNK,
        { fileId, offset, length: len, size },
        state.clientId
      );
      const u8 = new Uint8Array(buf);

      try {
        state.wc.send_rpc_frame_bytes(rpcId, METHOD.FILE_GET_CHUNK, u8);
      } catch (e) {
        clearTimeout(state.rpcStreams.get(rpcId)?.timer);
        state.rpcStreams.delete(rpcId);
        reject(e);
      }
    });

    allParts.push(...streamRes.parts);
    offset += streamRes.totalRead;
  }

  const mimeType = null;

  const blob = new Blob(allParts, {
    type: mimeType || "application/octet-stream",
  });
  // const base64 = await blobToBase64(blob);
  // localStorage.setItem(fileId, base64);
  // const a = document.createElement("a");
  // a.href = URL.createObjectURL(blob);
  // a.download = fileName || "file.p";
  // a.click();

  return blob;
};

const getMimeFromName = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();

  return (
    {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      mp4: "video/mp4",
      txt: "text/plain",
    }[ext] || "application/octet-stream"
  );
};