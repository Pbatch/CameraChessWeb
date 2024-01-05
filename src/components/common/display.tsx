const Display = ({ text }: {text: string[]}) => {
  return (
    <div className="text-white">
      {text.map(function(t, i){
          return <div key={i}>{t}</div>;
      })}
    </div>
  );
};

export default Display;