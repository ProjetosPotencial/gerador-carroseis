import svgPaths from "./svg-l2yh47psh";
import imgRectangle8 from "figma:asset/94f0de88dd7da2aa7b58f6680bcc081b5b16c90f.png";
import imgLogoParceleAqui1 from "figma:asset/f105090c0d8399c4c5ddf6f3b68c32fc5dfd387f.png";

function Group() {
  return (
    <div className="absolute contents left-[658px] top-[178px]">
      <div className="absolute h-[510px] left-[658px] rounded-bl-[32px] rounded-br-[32px] rounded-tl-[240px] rounded-tr-[32px] top-[178px] w-[590px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-bl-[32px] rounded-br-[32px] rounded-tl-[240px] rounded-tr-[32px]">
          <img alt="" className="absolute h-[173.57%] left-0 max-w-none top-[-49.56%] w-full" src={imgRectangle8} />
        </div>
      </div>
      <div className="absolute bg-gradient-to-b from-[32.867%] from-[rgba(0,0,0,0)] h-[510px] left-[658px] rounded-bl-[32px] rounded-br-[32px] rounded-tl-[240px] rounded-tr-[32px] to-[95.333%] to-[rgba(0,0,0,0.8)] top-[178px] w-[590px]" />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-[700px] top-[599px]">
      <p className="absolute font-['Kufam:Bold',sans-serif] leading-[0] left-[700px] not-italic text-[0px] text-white top-[599px] whitespace-pre">
        <span className="font-['Kufam:Regular',sans-serif] leading-[1.32] text-[24px]">Tecnologia que destrava</span>
        <span className="leading-[1.32] text-[24px]">
          {` `}
          <br aria-hidden="true" />o seu dia a dia financeiro.
        </span>
      </p>
    </div>
  );
}

function AccountCircle56DpFfffffFill0Wght200Grad0Opsz() {
  return (
    <div className="absolute left-[72px] size-[80px] top-[282px]" data-name="account_circle_56dp_FFFFFF_FILL0_wght200_GRAD0_opsz48 1">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80 80">
        <g id="account_circle_56dp_FFFFFF_FILL0_wght200_GRAD0_opsz48 1">
          <path d={svgPaths.p325f5470} fill="var(--fill-0, #371B01)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

export default function CapaNews() {
  return (
    <div className="bg-white relative size-full" data-name="capa news 49">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#ffcb31] h-[579px] left-[calc(50%-305.5px)] rounded-[32px] top-[calc(50%+38.5px)] w-[605px]" />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#ffcb31] h-[579px] left-[calc(50%+269.5px)] rounded-bl-[32px] rounded-br-[32px] rounded-tl-[32px] rounded-tr-[320px] top-[calc(50%+38.5px)] w-[677px]" />
      <Group />
      <div className="absolute h-[33px] left-[32px] top-[39px] w-[192px]" data-name="logo_parceleAqui 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[280.41%] left-[-7.98%] max-w-none top-[-94.89%] w-[115.96%]" src={imgLogoParceleAqui1} />
        </div>
      </div>
      <p className="-translate-x-full absolute font-['Kufam:Bold',sans-serif] leading-[1.2] left-[calc(50%+608px)] not-italic text-[#371b01] text-[20px] text-right top-[39px] tracking-[-0.4px] w-[174px]">Parcele News</p>
      <div className="-translate-x-full -translate-y-1/2 absolute flex flex-col font-['Kufam:Bold',sans-serif] justify-center leading-[0] left-[calc(50%+611px)] not-italic text-[#371b01] text-[60px] text-right top-[87.5px] tracking-[-1.2px] w-[109px]">
        <p className="leading-[1.2]">#49</p>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#ffe8a4] left-[calc(50%-528px)] rounded-[16px] size-[80px] top-[calc(50%-38px)]" />
      <p className="absolute font-['Kufam:Bold',sans-serif] leading-[1.2] left-[72px] not-italic text-[#371b01] text-[48px] top-[398px] tracking-[-0.96px] w-[565px] whitespace-pre-wrap">
        {`Mercado B2C: `}
        <br aria-hidden="true" />
        {`o uso estratégico `}
        <br aria-hidden="true" />e consciente do parcelamento
      </p>
      <Group1 />
      <AccountCircle56DpFfffffFill0Wght200Grad0Opsz />
    </div>
  );
}