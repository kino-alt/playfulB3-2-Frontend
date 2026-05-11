interface PageHeaderProps {
  title: string
  subtitle:string
  marginBottom?: string
}

export function PageHeader({title,subtitle,marginBottom ="mb-6"}: PageHeaderProps){
  return(
    <div className={"text-center "+ marginBottom}>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent mb-1">
        {title}
      </h1>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{subtitle}</p>
    </div>
  );
};
