"use client";

import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const router = useRouter();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        setStatus(error.message);
        setSubmitting(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    },
  });

  const inputCn = (touched: boolean | undefined, error: string | undefined) =>
    cn(
      "px-3 py-2 border rounded-md bg-canvas text-ink text-sm outline-none transition-colors placeholder:text-faint",
      touched && error
        ? "border-danger focus:border-danger"
        : "border-border focus:border-ink"
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-10 shadow-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-ink rounded-lg flex items-center justify-center font-serif text-canvas text-sm tracking-wide">
            IG
          </div>
          <h1 className="font-serif text-2xl text-ink">Interval Guard</h1>
          <p className="text-sm text-muted">AI-Verified Outreach Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputCn(formik.touched.email, formik.errors.email)}
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-[12px] text-danger">{formik.errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputCn(formik.touched.password, formik.errors.password)}
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-[12px] text-danger">{formik.errors.password}</p>
            )}
          </div>

          {/* Server error */}
          {formik.status && (
            <div className="px-3 py-2.5 bg-danger-light border border-danger-mid rounded-md text-danger text-[13px]">
              {formik.status}
            </div>
          )}

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full mt-1 py-2.5 bg-ink text-canvas text-sm font-medium rounded-md cursor-pointer hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {formik.isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">
          Interval AI — Compliance-Grade Collections Outreach
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
