import { MOCK_KTEOFILE_DATA_1 } from "../KTEOFile/mockKTEOFile1";
import { MOCK_KTEOFILE_DATA_2 } from "../KTEOFile/mockKTEOFile2";
import { MOCK_COMMENT_DATA_1 } from "../Comment/mockComment1";
import { MOCK_COMMENT_DATA_2 } from "../Comment/mockComment2";

export const MOCK_POST_DATA_1 = {
    postID: "2",
    tieuDe: "Gardevoir Ipsum is simply dummy",
    moTa: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the",
    ngayDang: "2026-05-13T14:30:00Z",
    dynamicWM: false,
    tacGia: 3,
    luotXem: 12544,
    luotThich: 508,
    sanPhamAI: true,
    hanCheHienThi: 1, //tạm tạm 0 là k có, 1 là 18+ đi
    choPhepComment: false,
    daXemXetBaoCao: true,
    congKhai: true,
    lstGanThe: ["gardevoir", "pokemon", "anhdep"],
    lstKTEOFile: [MOCK_KTEOFILE_DATA_1, MOCK_KTEOFILE_DATA_2],
    lstComment: [MOCK_COMMENT_DATA_1, MOCK_COMMENT_DATA_2],
};