import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

export const BarcodePreview: React.FC<{ value: string; format?: string }> = ({
  value,
  format = "EAN13",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: format as any,
        lineColor: "#000",
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      });
    }
  }, [value, format]);

  return <svg ref={svgRef} className="w-full" />;
};



