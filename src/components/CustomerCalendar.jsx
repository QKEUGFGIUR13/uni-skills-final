import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  getYear,
  getMonth,
} from "date-fns";
import { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useRef } from "react";

import { RiArrowDownSLine } from "react-icons/ri";

const CustomCalendar = ({ streakDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const currentYear = getYear(currentMonth);
  const [open, setOpen] = useState(false);
  const years = Array.from({ length: 100 }, (_, i) => 2000 + i);
  const dropdownRef = useRef();

  const handleSelect = (year) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setOpen(false);
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedStreaks = new Set(
    (Array.isArray(streakDates) ? streakDates : []).map((d) =>
      format(new Date(d), "yyyy-MM-dd")
    )
  );

  const ScrollableMonthDropdown = ({ currentMonth, setCurrentMonth }) => {
    const [open, setOpen] = useState(false);
    const currentMonthIndex = getMonth(currentMonth);

    const handleSelect = (monthIndex) => {
      const newDate = setMonth(currentMonth, monthIndex);
      setCurrentMonth(newDate);
      setOpen(false);
    };

    return (
      <div className="relative w-32">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-full bg-zinc-900 border border-zinc-700 text-orange-400 px-3 py-1 rounded text-sm flex items-center justify-between"
        >
          {months[currentMonthIndex]}
          <RiArrowDownSLine />
        </button>

        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded max-h-52 overflow-y-auto shadow-lg w-full text-sm"
          >
            {months.map((month, index) => (
              <li
                key={index}
                onClick={() => handleSelect(index)}
                className={`px-3 py-1 cursor-pointer hover:bg-orange-500/10 ${
                  index === currentMonthIndex
                    ? "bg-orange-500/30 text-orange-400"
                    : "text-white"
                }`}
              >
                {month}
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={() =>
          setCurrentMonth(
            new Date(getYear(currentMonth), getMonth(currentMonth) - 1, 1)
          )
        }
        className="text-orange-400 hover:text-orange-300"
      >
        <div className="h-6 w-6 flex items-center justify-center bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition-colors">
          <FiChevronLeft size={20} />
        </div>
      </button>

      <div className="flex items-center gap-2">
        <ScrollableMonthDropdown
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />

        <div className="relative w-28">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="w-full bg-zinc-900 border border-zinc-700 text-orange-400 px-3 py-1 rounded text-sm flex items-center justify-between"
          >
            {currentYear}
            <RiArrowDownSLine />
          </button>

          {open && (
            <motion.ul
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded max-h-48 overflow-y-auto shadow-lg w-full text-sm"
            >
              {years.map((year) => (
                <li
                  key={year}
                  onClick={() => handleSelect(year)}
                  className={`px-3 py-1 cursor-pointer hover:bg-orange-500/10 ${
                    year === currentYear
                      ? "bg-orange-500/30 text-orange-400"
                      : "text-white"
                  }`}
                >
                  {year}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>

      <button
        onClick={() =>
          setCurrentMonth(
            new Date(getYear(currentMonth), getMonth(currentMonth) + 1, 1)
          )
        }
        className="text-orange-400 hover:text-orange-300"
      >
        <div className="h-6 w-6 flex items-center justify-center bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition-colors">
          <FiChevronRight size={20} />
        </div>
      </button>
    </div>
  );

  const renderDays = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2 text-sm text-zinc-400">
        {weekdays.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formatted = format(day, "yyyy-MM-dd");
        const isStreak = formattedStreaks.has(formatted);
        const inMonth = isSameMonth(day, monthStart);

        days.push(
          <motion.div
            key={day}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`w-10 h-10 hover:scale-125 transition transform text-center rounded-md flex items-center justify-center font-semibold 
              ${
                inMonth
                  ? isStreak
                    ? "bg-orange-400 text-white"
                    : "bg-zinc-800 text-white"
                  : "bg-zinc-700 text-zinc-500"
              }`}
          >
            {format(day, "d")}
          </motion.div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={format(day, "yyyy-MM-dd")} className="grid grid-cols-7 gap-2">
          {days}
        </div>
      );

      days = [];
    }

    return <div className="space-y-2">{rows}</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-700 w-full"
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </motion.div>
  );
};

export default CustomCalendar;
