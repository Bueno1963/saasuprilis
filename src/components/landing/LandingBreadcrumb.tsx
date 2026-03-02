import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface LandingBreadcrumbProps {
  items: BreadcrumbItem[];
}

const LandingBreadcrumb = ({ items }: LandingBreadcrumbProps) => {
  return (
    <div className="bg-[hsl(0,0%,97%)] border-b border-border/30">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/landing" className="hover:text-[hsl(205,78%,45%)] transition-colors">Home</Link>
          {items.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span>&gt;</span>
              {item.href ? (
                <Link to={item.href} className="hover:text-[hsl(205,78%,45%)] transition-colors">{item.label}</Link>
              ) : (
                <span className={idx === items.length - 1 ? "text-[hsl(205,78%,45%)] font-medium" : ""}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingBreadcrumb;
