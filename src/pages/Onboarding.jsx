import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Home,
  Car,
  Zap,
  Droplets,
  Recycle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import createBrowserClient from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Progress } from "@/components/ui/Progress";
import { Card } from "@/components/ui/Card";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/context/AuthContext";

const transportOptions = [
  { value: "car_gasoline", label: "Carro (Gasolina)", icon: "🚗" },
  { value: "car_electric", label: "Carro elétrico", icon: "⚡" },
  { value: "car_hybrid", label: "Carro híbrido", icon: "🔋" },
  { value: "motorcycle", label: "Moto", icon: "🏍️" },
  { value: "public_transport", label: "Transporte público", icon: "🚌" },
  { value: "bicycle", label: "Bicicleta", icon: "🚴" },
  { value: "walk", label: "A pé", icon: "🚶" },
  { value: "mixed", label: "Misto", icon: "🔄" },
];

const heatingOptions = [
  { value: "electric", label: "Elétrico", icon: "⚡" },
  { value: "gas", label: "Gás", icon: "🔥" },
  { value: "solar", label: "Solar", icon: "☀️" },
  { value: "none", label: "Não tenho", icon: "❌" },
];

const residenceSizeOptions = [
  { value: "small", label: "Pequena (até 50m²)", icon: "🏠" },
  { value: "medium", label: "Média (50-100m²)", icon: "🏡" },
  { value: "large", label: "Grande (+100m²)", icon: "🏘️" },
];

const recyclingOptions = [
  { value: "always", label: "Sempre", icon: "♻️" },
  { value: "sometimes", label: "Às vezes", icon: "🔄" },
  { value: "rarely", label: "Raramente", icon: "⚠️" },
  { value: "never", label: "Nunca", icon: "❌" },
];

const initialFormState = {
  name: "",
  household_size: "",
  transportation_type: "",
  has_solar_panels: false,
  heating_type: "",
  residence_size: "",
  has_garden: false,
  recycling_habit: "",
};

export default function Onboarding() {
  const supabase = createBrowserClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => ({ ...initialFormState }));
  const [userInfos, setUserInfos] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    let mounted = true;

    const guard = async () => {
      try {
        if (!mounted) return;

        if (!currentUser) {
          // Não autenticado -> vai para Login
          navigate(createPageUrl("Login"));
          return;
        }

        // Buscamos dados do usuário na tabela de infos
        const { data: userInfos, error: infosError } = await supabase
          .from("tb_user_infos")
          .select("onboarding_completed")
          .eq("user_id", currentUser.id)
          .single();

        if (infosError && infosError.code !== "PGRST116") {
          // PGRST116 = no rows found for single() in PostgREST/Supabase; ignoramos
          throw infosError;
        }

        // Se já completou onboarding, vai para Dashboard
        if (userInfos?.onboarding_completed) {
          navigate(createPageUrl("Dashboard"));
          return;
        }

        // Carrega o usuário (com informações encontradas) e inicia com form vazio
        setUserInfos({ ...userInfos });
        setFormData({ ...initialFormState });
      } catch (error) {
        console.error("Erro ao verificar onboarding:", error);
        if (mounted) navigate(createPageUrl("Login"));
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    guard();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateUser = useMutation({
    mutationFn: async (payload) => {
      if (!currentUser) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("tb_user_infos")
        .upsert(
          { user_id: currentUser.id, ...payload },
          { onConflict: "user_id" }
        );
      if (error) throw error;

      return true;
    },
    onSuccess: () => navigate(createPageUrl("Dashboard")),
  });

  const nextDisabled = () => {
    switch (step) {
      case 1:
        return (
          !formData.name.trim() ||
          !formData.household_size ||
          !formData.residence_size
        );
      case 2:
        return !formData.transportation_type;
      case 3:
        return !formData.heating_type;
      case 4:
        return !formData.recycling_habit;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name.trim(),
      household_size: Number(formData.household_size),
      transportation_type: formData.transportation_type,
      has_solar_panels: formData.has_solar_panels,
      heating_type: formData.heating_type,
      residence_size: formData.residence_size,
      has_garden: formData.has_garden,
      recycling_habit: formData.recycling_habit,
      onboarding_completed: true,
      has_seen_intro: true,
    };

    updateUser.mutate(payload);
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Vamos personalizar seu EcoLar
          </h1>
          <p className="mt-2 text-gray-600">
            Conte um pouco sobre a casa para receber insights sob medida.
          </p>
        </motion.div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>
              Passo {step} de {totalSteps}
            </span>
            <span className="font-semibold text-emerald-600">
              {progress.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="border-0 p-8 shadow-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Sua casa
                    </h2>
                    <p className="text-gray-600">
                      Comece contando quem você é e os detalhes da residência.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-name">Seu nome</Label>
                  <Input
                    id="onb-name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex: Ana Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-household">Pessoas na casa</Label>
                  <Input
                    id="onb-household"
                    type="number"
                    min="1"
                    value={formData.household_size}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        household_size: event.target.value,
                      }))
                    }
                    placeholder="Ex: 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamanho da residência</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {residenceSizeOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={
                          formData.residence_size === option.value
                            ? "default"
                            : "outline"
                        }
                        className={`h-auto flex-col py-4 ${
                          formData.residence_size === option.value
                            ? "bg-emerald-600"
                            : ""
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            residence_size: option.value,
                          }))
                        }
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant={formData.has_garden ? "default" : "outline"}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        has_garden: !prev.has_garden,
                      }))
                    }
                  >
                    <Droplets className="mr-2 h-4 w-4" />{" "}
                    {formData.has_garden ? "Tenho" : "Não tenho"} jardim/ horta
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Transporte
                    </h2>
                    <p className="text-gray-600">
                      Qual o meio de transporte mais frequente?
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {transportOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        formData.transportation_type === option.value
                          ? "default"
                          : "outline"
                      }
                      className={`h-auto flex-col py-4 text-center ${
                        formData.transportation_type === option.value
                          ? "bg-purple-600"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          transportation_type: option.value,
                        }))
                      }
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Energia
                    </h2>
                    <p className="text-gray-600">
                      Sobre o aquecimento de água e painéis solares.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {heatingOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        formData.heating_type === option.value
                          ? "default"
                          : "outline"
                      }
                      className={`h-auto flex-col py-4 ${
                        formData.heating_type === option.value
                          ? "bg-yellow-500 text-white"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          heating_type: option.value,
                        }))
                      }
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant={formData.has_solar_panels ? "default" : "outline"}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      has_solar_panels: !prev.has_solar_panels,
                    }))
                  }
                >
                  ☀️ {formData.has_solar_panels ? "Tenho" : "Não tenho"} painéis
                  solares
                </Button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 p-3 text-green-600">
                    <Recycle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Hábitos
                    </h2>
                    <p className="text-gray-600">
                      Conte como a casa lida com reciclagem.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recyclingOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        formData.recycling_habit === option.value
                          ? "default"
                          : "outline"
                      }
                      className={`h-auto flex-col py-4 ${
                        formData.recycling_habit === option.value
                          ? "bg-green-600"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          recycling_habit: option.value,
                        }))
                      }
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-emerald-700">
                    ✨ Tudo pronto!
                  </p>
                  <p>
                    Usaremos essas informações para personalizar suas
                    recomendações e métricas.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep((prev) => prev - 1)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                type="button"
                className="flex-1"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={nextDisabled()}
              >
                Próximo <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                onClick={handleSubmit}
                disabled={updateUser.isPending || nextDisabled()}
              >
                {updateUser.isPending ? (
                  "Salvando..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Finalizar <Sparkles className="h-4 w-4" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
