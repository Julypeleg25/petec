function TableUnEditableCellElement() {
  return (
    <div className="un-editable-cell">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          vector-effect="non-scaling-stroke"
          stroke="red"
        />
        <line
          x1="0"
          y1="100"
          x2="100"
          y2="0"
          vector-effect="non-scaling-stroke"
          stroke="red"
        />
      </svg>
    </div>
  );
}

export default TableUnEditableCellElement;
