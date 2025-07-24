import logoImage from "/src/assets/logo.png"

const Background = ({ width, height, theme }) => {
  const dashHeight = 10;
  const dashGap = 5;
  const centerLineHeight = height;

  // Oblicz rozmiar logo - proporcjonalny do rozmiaru pola gry
  const logoSize = Math.min(width, height) * 0.9;

  return (
    <div
      className="bg-black border-4 relative"
      style={{ 
        width, 
        height,
        borderColor: theme.primary
      }}
    >
      {/* Logo w tle */}
      <img 
        className="absolute opacity-8 select-none pointer-events-none" 
        src={logoImage}
        alt="Logo"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: logoSize,
          height: logoSize,
          objectFit: 'contain', // Zachowuje proporcje logo
          zIndex: 1
        }}
      />
      
      {/* Centralna linia - nad logo */}
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
          )`,
          zIndex: 2 // Linia nad logo
        }}
      />
    </div>
  );
};

export default Background;