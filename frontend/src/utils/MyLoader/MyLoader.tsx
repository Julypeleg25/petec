import { RotatingLines } from "react-loader-spinner";
import "./MyLoader.css";
import { MyLoaderProps } from "./MyLoader.types";

function MyLoader({ size = "70" }: MyLoaderProps) {
  return (
    <div className="MyLoader">
      <RotatingLines
        visible={true}
        width={size}
        strokeWidth="5"
        animationDuration="0.75"
        ariaLabel="rotating-lines-loading"
        strokeColor="var(--color-main)"
      />
    </div>
  );
}

export default MyLoader;
