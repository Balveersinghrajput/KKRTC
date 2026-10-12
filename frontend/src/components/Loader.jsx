export function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader" role="status">
      <div className="spin" />
      <span>{text}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="pageload" role="status">
      <img src="/logo.svg" alt="" width="56" height="56" />
      <div className="spin big" />
      <span>Loading...</span>
    </div>
  );
}