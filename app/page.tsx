"use client";

import React, {useEffect, useState, useRef} from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

/** 오늘 날짜(YYYYMMDD) 계산 */
function getTodayString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
}

interface MyException {
    id: number;
    instanceId: string;
    lineNo: number;
    preLines: string;
    exceptionMessage: string;
    stackTrace: string;
}

export default function HomePage() {
    const [instances, setInstances] = useState<string[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [exceptionsForDate, setExceptionsForDate] = useState<MyException[]>([]);

    // 모달
    const [openModal, setOpenModal] = useState(false);
    const [selectedException, setSelectedException] = useState<MyException | null>(null);

    // 모달 내용만 복사하기 위한 ref
    const contentRef = useRef<HTMLDivElement>(null);

    // "복사" 버튼 상태: idle / copied / fading
    const [copyPhase, setCopyPhase] = useState<"idle" | "copied" | "fading">("idle");
    // 복사 버튼 활성/비활성
    const [disableCopyBtn, setDisableCopyBtn] = useState(false);

    const today = getTodayString();

    // 1) 인스턴스 목록
    useEffect(() => {
        axios
            .get<string[]>("http://localhost:4000/logs/instances")
            .then((res) => {
                setInstances(res.data);
                if (res.data.length > 0) {
                    setSelectedId(res.data[0]);
                }
            })
            .catch((err) => {
                console.error(err);
                alert("인스턴스 목록 조회 중 오류 발생");
            });
    }, []);

    // 2) 인스턴스 변경 시 날짜 목록 불러오기
    useEffect(() => {
        if (!selectedId) return;
        fetchExtractedDates(selectedId);
        setSelectedDate(null);
        setExceptionsForDate([]);
    }, [selectedId]);

    const fetchExtractedDates = async (instId: string) => {
        try {
            const res = await axios.get<string[]>(`http://localhost:4000/logs/extracted-dates/${instId}`);
            setDates(res.data);
        } catch (error) {
            console.error(error);
            alert("이전 로그 목록 조회 중 오류 발생");
        }
    };

    const hasTodayLog = dates.includes(today);

// 3) 로그 추출
    const handleExtract = async () => {
        if (!selectedId) {
            alert("인스턴스를 선택하세요.");
            return;
        }
        try {
            const res = await axios.post("http://localhost:4000/logs/extract", {
                instanceId: selectedId,
            });
            alert(res.data.message);
            await fetchExtractedDates(selectedId);
        } catch (error) {
            console.error(error);
            alert("로그 추출 중 오류 발생");
        }
    };

// 4) 날짜 클릭 → 예외 목록
    const handleDateClick = async (date: string) => {
        try {
            const res = await axios.get<MyException[]>("http://localhost:4000/logs/exceptions-date", {
                params: {instanceId: selectedId, date},
            });
            setSelectedDate(date);
            setExceptionsForDate(res.data);
        } catch (err) {
            console.error(err);
            alert("해당 날짜 예외 목록 조회 중 오류 발생");
        }
    };

// 예외 클릭 → 모달 열기
    const handleExceptionClick = (ex: MyException) => {
        setSelectedException(ex);
        setOpenModal(true);
    };

// 모달 닫기
    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedException(null);
    };

// 날짜 목록 화면으로 돌아가기
    const handleBackToDates = () => {
        setSelectedDate(null);
        setExceptionsForDate([]);
    };

// ESC 키 감지 -> 모달 닫기
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && openModal) {
                handleCloseModal();
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [openModal]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-4">
            <div className="mx-auto max-w-[1600px]">
                {/* 상단 헤더 */}
                <div className="flex items-center mb-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/headache.svg" width={150} height={200} alt="logo"/>
                    </Link>
                    <h1 className="ml-4 text-3xl font-bold">Tomcat Exception<br/> 조회 시스템</h1>
                </div>

                {/* 인스턴스 선택 & 로그 추출 */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div>
                        <label className="block mb-1 font-medium" htmlFor="instanceSelect">
                            인스턴스
                        </label>
                        <select
                            id="instanceSelect"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                        >
                            {instances.map((inst) => (
                                <option key={inst} value={inst}>
                                    {inst}
                                </option>
                            ))}
                        </select>
                    </div>
                    {!hasTodayLog ? (
                        <button
                            onClick={handleExtract}
                            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
                        >
                            오늘({today}) 로그 추출
                        </button>
                    ) : (
                        <span className="text-green-600">
              오늘({today}) 로그가 이미 추출되었습니다.
            </span>
                    )}
                </div>

                {/* 날짜 목록 or 예외 목록 */}
                {selectedDate ? (
                    <div className="bg-white shadow p-4 rounded">
                        <h2 className="text-xl font-semibold mb-2">
                            [{selectedId}] {selectedDate} 예외 목록
                        </h2>
                        <button
                            onClick={handleBackToDates}
                            className="text-blue-600 underline mb-2"
                        >
                            ← 날짜 목록으로
                        </button>
                        {exceptionsForDate.length > 0 ? (
                            <div className="overflow-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="p-2 text-left">Line No</th>
                                        <th className="p-2 text-left">Exception Message</th>
                                        <th className="p-2 text-left">상세</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {exceptionsForDate.map((ex) => (
                                        <tr key={ex.id} className="border-b">
                                            <td className="p-2">{ex.lineNo}</td>
                                            <td className="p-2">
                                                {ex.exceptionMessage.slice(0, 80)}
                                                {ex.exceptionMessage.length > 80 && "..."}
                                            </td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => handleExceptionClick(ex)}
                                                    className="border border-gray-400 rounded px-2 py-1 hover:bg-gray-50"
                                                >
                                                    보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>해당 날짜에 예외가 없습니다.</p>
                        )}
                    </div>
                ) : dates.length > 0 ? (
                    <div className="bg-white shadow p-4 rounded">
                        <h2 className="text-xl font-semibold mb-2">이전 로그 목록</h2>
                        <div className="overflow-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-2 text-left">날짜 (YYYYMMDD)</th>
                                    <th className="p-2 text-left">예외 목록</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dates.map((date) => (
                                    <tr key={date} className="border-b">
                                        <td className="p-2">{date}</td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => handleDateClick(date)}
                                                className="border border-gray-400 rounded px-2 py-1 hover:bg-gray-50"
                                            >
                                                예외 조회
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 mt-4">아직 추출된 로그가 없습니다.</p>
                )}
            </div>

            {/* 예외 상세 모달 */}
            {openModal && selectedException && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
                    onClick={handleCloseModal}
                >
                    <div
                        className="relative bg-white w-[80%] h-[80%] rounded shadow-lg flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        tabIndex={-1}
                    >
                        {/* 상단 영역 */}
                        <div className="flex-none border-b p-4">
                            <h3 className="text-xl font-semibold">예외 상세</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                날짜: {selectedDate} / Line: {selectedException.lineNo}
                            </p>
                        </div>

                        {/* 중간(스크롤 영역) */}
                        <div className="flex-grow overflow-auto p-4 text-sm" ref={contentRef}>
                            <div className="mb-2 text-gray-700">
                                <b>preLines:</b>
                                <pre className="whitespace-pre-wrap text-sm mt-1">
                                  {selectedException.preLines || "(없음)"}
                                </pre>
                            </div>
                            <div className="mb-2 whitespace-pre-wrap">
                                <b>Exception Message:</b> {selectedException.exceptionMessage}
                            </div>
                            <div className="mb-4">
                                <b>Stack Trace:</b>
                                <pre className="whitespace-pre-wrap text-sm mt-1">
                                  {selectedException.stackTrace || "(없음)"}
                                </pre>
                            </div>
                        </div>

                        {/* 하단 영역 (복사 버튼 + 닫기 버튼) */}
                        <div className="flex-none border-t p-4 text-right space-x-2">
                            {/* 복사 버튼 */}
                            <button
                                onClick={async () => {
                                    if (!contentRef.current) return;
                                    const html = contentRef.current.innerHTML;
                                    const text = contentRef.current.innerText;

                                    try {
                                        // 복사 로직 성공 시 상태 변경
                                        await navigator.clipboard.write([
                                            new ClipboardItem({
                                                "text/html": new Blob([html], {type: "text/html"}),
                                                "text/plain": new Blob([text], {type: "text/plain"}),
                                            }),
                                        ]);

                                        // 즉시 복사됨 표시 + 빨간색
                                        setCopyPhase("copied");
                                        setDisableCopyBtn(true);

                                        // 50ms 뒤 -> 5초간 초록색 페이드
                                        setTimeout(() => {
                                            setCopyPhase("fading");
                                        }, 50);

                                        // 5초 후 -> 원래 상태(복사) + 버튼 활성화
                                        setTimeout(() => {
                                            setCopyPhase("idle");
                                            setDisableCopyBtn(false);
                                        }, 5050);

                                    } catch (err) {
                                        console.error("복사 실패", err);
                                        alert("복사에 실패했습니다.");
                                    }
                                }}
                                disabled={disableCopyBtn}
                                // copyPhase, disableCopyBtn 상태에 따라 클래스/스타일 결정
                                className={`
                                  text-white px-4 py-2 rounded 
                                  ${copyPhase === "copied" ? "bg-red-600" : copyPhase === "fading" ? "bg-green-600" : "bg-green-600 hover:bg-green-700"}
                                  ${disableCopyBtn ? "cursor-not-allowed opacity-80" : ""}
                                `}
                                style={copyPhase === "fading" ? {transition: "background-color 5s"} : {}}
                            >
                                {copyPhase === "idle" ? "복사"
                                    : copyPhase === "copied" ? "복사됨"
                                        : copyPhase === "fading" ? "복사됨"
                                            : "복사"
                                }
                            </button>

                            {/* 닫기 버튼 */}
                            <button
                                onClick={handleCloseModal}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}