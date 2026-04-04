"use client";

export default function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-[#050810] p-4 ${className}`}>
      {/* Phone shell */}
      <div className="relative w-[390px] h-[844px] rounded-[50px] border-[6px] border-[#2A2A2A] bg-[var(--background)] shadow-2xl overflow-hidden flex flex-col">
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-black rounded-b-[18px] z-50" />

        {/* Status bar spacer */}
        <div className="h-[54px] shrink-0" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Home indicator */}
        <div className="h-[34px] flex items-end justify-center pb-2 shrink-0">
          <div className="w-[134px] h-[5px] rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
