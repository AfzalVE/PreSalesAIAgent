import { motion } from 'framer-motion';
import { BadgeDollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import SkillTag from '../common/SkillTag';

export default function EmployeeCard({ employee, onManage }) {
  const isAvailable = employee.availability === "Available";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4, boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.05)" }}
      className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* User Info Header */}
        <div className="flex items-center space-x-3.5 pb-4 border-b border-neutral-100">
          <img 
            src={employee.avatar} 
            alt={employee.name} 
            className="w-12 h-12 rounded-xl object-cover border border-neutral-200/60"
          />
          <div>
            <h4 className="text-sm font-bold text-neutral-800 tracking-tight">{employee.name}</h4>
            <p className="text-xs text-brand-600 font-semibold mt-0.5">{employee.role}</p>
          </div>
        </div>

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold border-b border-neutral-100/50">
          <div className="flex items-center text-neutral-600">
            <BadgeDollarSign size={14} className="mr-1.5 text-neutral-400" />
            <span>${employee.hourlyCost}/hr</span>
          </div>
          <div className="flex items-center text-neutral-600">
            <Clock size={14} className="mr-1.5 text-neutral-400" />
            <span>Exp: {employee.experience}</span>
          </div>
        </div>

        {/* Skills Tag layout */}
        <div className="py-4">
          <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block mb-2">Core Tech Competency</span>
          <div className="flex flex-wrap gap-1">
            {employee.skills.map((skill) => (
              <SkillTag key={skill} skill={skill} />
            ))}
          </div>
        </div>
      </div>

      {/* Bench Details Bottom Panel */}
      <div className="pt-4 border-t border-neutral-100/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {isAvailable ? (
              <CheckCircle2 size={12} className="text-brand-500 mr-1" />
            ) : (
              <AlertCircle size={12} className="text-amber-500 mr-1" />
            )}
            <span className={isAvailable ? "text-brand-700" : "text-amber-700"}>
              {employee.availability}
            </span>
          </div>
          {employee.benchStatus && (
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
              On Bench
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-neutral-500 font-medium">
            Allocated: <strong className="text-neutral-800 font-bold">{employee.currentAllocation}%</strong>
          </span>
          {onManage && (
            <button
              onClick={() => onManage(employee)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200/60 shadow-sm"
            >
              Manage →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
