import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <CardTitle className="text-2xl">Email confirmado</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sua conta foi confirmada com sucesso. Acesse o sistema para continuar.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate("/login")} className="w-full">
            Ir para login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
