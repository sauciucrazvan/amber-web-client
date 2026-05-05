export default function Titlebar() {
  return (
    <header className="bg-sidebar text-sidebar-foreground flex h-10 shrink-0 items-center px-3 select-none">
      <img
        src={`${import.meta.env.BASE_URL}amber.png`}
        alt="Amber logo"
        className="size-5"
        draggable={false}
      />
    </header>
  );
}
