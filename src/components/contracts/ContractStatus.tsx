import { ContractStatus as Status } from "@/types/contract";
import { getStatusColor, getStatusLabel } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ContractStatusProps {
  status: Status;
  className?: string;
  showIcon?: boolean;
}

export function ContractStatus({
  status,
  className,
  showIcon = true,
}: ContractStatusProps) {
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case "active":
        return "🟢";
      case "expiring_soon":
        return "🟡";
      case "expired":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusVariant = (status: Status) => {
    switch (status) {
      case "active":
        return "default";
      case "expiring_soon":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn(
        "font-medium",
        status === "active" && "bg-green-100 text-green-800 hover:bg-green-200",
        status === "expiring_soon" &&
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        status === "expired" && "bg-red-100 text-red-800 hover:bg-red-200",
        className,
      )}
    >
      {showIcon && <span className="mr-1">{getStatusIcon(status)}</span>}
      {getStatusLabel(status)}
    </Badge>
  );
}
