"use client";

import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";

interface currentPathProps {
  x: number;
  y: number;
}

interface currentStyleProps {
  color: string;
  lineWidth: number;
}
interface drawingActionsProps {
  path: currentPathProps[];
  style: currentStyleProps;
}

const Board = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("black");
  const [lineWidth, setLineWidth] = useState(3);
  const [drawingActions, setDrawingActions] = useState<drawingActionsProps[]>(
    []
  );
  const [currentPath, setCurrentPath] = useState<currentPathProps[]>([]);
  const [currentStyle, setCurrentStyle] = useState<currentStyleProps>({
    color: "black",
    lineWidth: 3,
  });

  const reDrawPreviousData = (context: CanvasRenderingContext2D | null) => {
    if (context) {
      // Clear the canvas before redrawing
      context.clearRect(
        0,
        0,
        canvasRef.current?.width || 900,
        canvasRef.current?.height || 400
      );

      // Iterate over all stored drawing actions
      drawingActions.forEach((action) => {
        const { path, style } = action;

        // Set the drawing style
        context.strokeStyle = style.color;
        context.lineWidth = style.lineWidth;

        // Start a new path for each drawing action
        context.beginPath();
        context.moveTo(path[0].x, path[0].y);

        // Draw the path
        path.forEach(({ x, y }) => {
          context.lineTo(x, y);
        });

        // Stroke the path to apply the drawing style
        context.stroke();
      });
    }
  };

  const updateCanvasSize = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height * 0.6; // Adjust height to fit well on different screens
        reDrawPreviousData(context);
      }
    }
  };

  useEffect(() => {
    // Initialize canvas and context
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      setContext(ctx);
      updateCanvasSize();
    }

    // Handle resize events
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [context]);

  const getRelativePosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
      const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault(); // Prevent default touch behavior (e.g., scrolling)
    const { x, y } = getRelativePosition(e);
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
      setDrawing(true);
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault(); // Prevent default touch behavior
    if (!drawing) return;
    const { x, y } = getRelativePosition(e);
    if (context) {
      context.strokeStyle = currentStyle.color;
      context.lineWidth = currentStyle.lineWidth;
      context.lineTo(x, y);
      context.stroke();
      setCurrentPath((prev) => [...prev, { x, y }]);
    }
  };

  const endDrawing = () => {
    setDrawing(false);
    if (context) {
      context.closePath();
      if (currentPath.length > 0) {
        setDrawingActions((prev) => [
          ...prev,
          { path: currentPath, style: currentStyle },
        ]);
      }
      setCurrentPath([]);
    }
  };

  const changeColor = (color: string) => {
    setCurrentColor(color);
    setCurrentStyle({ ...currentStyle, color });
  };

  const changeWidth = (width: number) => {
    setLineWidth(width);
    setCurrentStyle({ ...currentStyle, lineWidth: width });
  };

  const undoDrawing = () => {
    if (drawingActions.length === 0) return;

    // Remove the last drawing action
    const newDrawingActions = drawingActions.slice(0, -1);
    setDrawingActions(newDrawingActions);

    // Redraw all remaining actions
    const newContext = canvasRef.current?.getContext("2d");
    if (newContext) {
      newContext.clearRect(
        0,
        0,
        canvasRef.current?.width || 900,
        canvasRef.current?.height || 400
      );

      newDrawingActions.forEach((action) => {
        const { path, style } = action;
        newContext.beginPath();
        newContext.moveTo(path[0].x, path[0].y);
        newContext.strokeStyle = style.color;
        newContext.lineWidth = style.lineWidth;
        path.forEach(({ x, y }) => {
          newContext.lineTo(x, y);
        });
        newContext.stroke();
      });
    }
  };

  const clearDrawing = () => {
    setDrawingActions([]);
    setCurrentPath([]);
    const newContext = canvasRef.current?.getContext("2d");
    if (newContext) {
      newContext.clearRect(
        0,
        0,
        canvasRef.current?.width || 900,
        canvasRef.current?.height || 400
      );
    }
  };

  const downloadImage = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "signature.png";
      link.click();
    }
  };

  const downloadPDF = () => {
    if (canvasRef.current) {
      const doc = new jsPDF("p", "mm", "a4");
      const imgData = canvasRef.current.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 10, 10, 190, 0); // Adjust x, y, width, height as needed
      doc.save("signature.pdf");
    }
  };

  return (
    <div className="w-full h-full flex-1 max-w-5xl m-auto">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        onTouchCancel={endDrawing}
        className="border border-black max-w-full max-h-[75%]"
      />
      <div className="my-4 flex sm:flex-row flex-col gap-5">
        <div className="flex justify-center space-x-4">
          {["red", "blue", "green", "yellow", "orange", "black"].map((val) => (
            <div
              key={val}
              className={
                "w-8 h-8 rounded-full cursor-pointer " +
                (val === "red"
                  ? "bg-red-500"
                  : val === "blue"
                  ? "bg-blue-700"
                  : val === "green"
                  ? "bg-green-700"
                  : val === "yellow"
                  ? "bg-yellow-300"
                  : val === "orange"
                  ? "bg-orange-500"
                  : val === "black"
                  ? "bg-black"
                  : "") +
                " " +
                (currentColor === val
                  ? val === "black"
                    ? "border-[4px] border-yellow-300"
                    : "border-[4px] border-black"
                  : "")
              }
              onClick={() => changeColor(val)}
            />
          ))}
        </div>
        <div className="flex-grow" />

        <input
          type="range"
          min={1}
          max={10}
          value={lineWidth}
          onChange={(e) => changeWidth(Number(e.target.value))}
        />
      </div>
      <div className="flex justify-center items-center gap-5 mt-5 flex-wrap">
        <button
          className="py-2 px-10 bg-red-500 rounded-md text-base text-white"
          onClick={clearDrawing}
        >
          Reset
        </button>
        <button
          className="py-2 px-10 bg-black rounded-md text-base text-white"
          onClick={undoDrawing}
        >
          Undo
        </button>
        <button
          className="py-2 px-10 bg-black rounded-md text-base text-white"
          onClick={downloadImage}
        >
          Download Image
        </button>
        <button
          className="py-2 px-10 bg-black rounded-md text-base text-white"
          onClick={downloadPDF}
        >
          Download Pdf
        </button>
      </div>
    </div>
  );
};

export default Board;
