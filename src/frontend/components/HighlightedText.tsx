interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const HighlightText = ({ text, searchTerm }: HighlightTextProps) => {
  if (!searchTerm || searchTerm?.length < 1) return <>{text}</>;

  const regex = new RegExp(`(${searchTerm?.trim()})`, 'i');
  const parts = text?.split(regex);

  return (
    <>
      {parts?.map((part, index) =>
        part?.toLowerCase() === searchTerm?.trim()?.toLowerCase() ? (
          <strong key={index} className="text-primary font-semibold">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

export default HighlightText;
