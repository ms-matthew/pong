import logoImage from "/src/assets/logo.png"

const Background = ({ width, height, theme }) => {
  const dashHeight = 10;
  const dashGap = 5;
  const centerLineHeight = height;

  return (
    <div
      className="bg-black border-2 relative"
      style={{ 
        width, 
        height,
        borderColor: theme.primary
      }}
    >
      <div
        className="absolute opacity-50"
        style={{
          width: '2px',
          height: centerLineHeight,
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          background: `repeating-linear-gradient(
            to bottom,
            ${theme.primary} 0px,
            ${theme.primary} ${dashHeight}px,
            transparent ${dashHeight}px,
            transparent ${dashHeight + dashGap}px
          )`
        }}
      />
      <img 
        className="absolute z-10 opacity-5" 
        src={logoImage}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};

export default Background;