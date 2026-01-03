import React from "react";

const ProgressBar = (props) => {
  const {
    isLoading = props.percent === "loading",
    percent,
  } = props;

  return (
    <div className="progress-outer">
      <div className={`progress ${isLoading ? "progress--" + "loading" : ""}`}>
        <div className={`progress-bar`} style={{ width: percent + "%" }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;
