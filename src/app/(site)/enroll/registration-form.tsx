"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { POSITIONS } from "@/lib/constants";
import {
  registrationFormSchema,
  type RegistrationFormInput,
} from "@/lib/validations/registration";

export function RegistrationForm({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues?: RegistrationFormInput;
  onNext: (values: RegistrationFormInput) => Promise<void> | void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormInput>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => onNext(values))}
      className="flex flex-col gap-10"
    >
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-display text-step-1">The player</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" required error={errors.firstName?.message}>
            {(a11y) => <Input {...a11y} autoComplete="off" {...register("firstName")} />}
          </Field>
          <Field label="Last name" required error={errors.lastName?.message}>
            {(a11y) => <Input {...a11y} autoComplete="off" {...register("lastName")} />}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Date of birth"
            required
            error={errors.dateOfBirth?.message}
            hint="Players must be 4–18 years old"
          >
            {(a11y) => <Input {...a11y} type="date" {...register("dateOfBirth")} />}
          </Field>
          <Field label="Gender" required error={errors.gender?.message}>
            {(a11y) => (
              <Select {...a11y} defaultValue="" {...register("gender")}>
                <option value="" disabled>
                  Select…
                </option>
                <option value="MALE">Boy</option>
                <option value="FEMALE">Girl</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Preferred position" error={errors.preferredPosition?.message}>
            {(a11y) => (
              <Select {...a11y} defaultValue="" {...register("preferredPosition")}>
                <option value="">No preference</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="School name" error={errors.schoolName?.message}>
            {(a11y) => <Input {...a11y} {...register("schoolName")} />}
          </Field>
        </div>
        <Field
          label="Medical notes"
          error={errors.medicalNotes?.message}
          hint="Allergies, asthma, or anything our coaches should know. Kept confidential."
        >
          {(a11y) => <Textarea {...a11y} rows={3} {...register("medicalNotes")} />}
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-display text-step-1">You, the guardian</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required error={errors.guardianName?.message}>
            {(a11y) => <Input {...a11y} autoComplete="name" {...register("guardianName")} />}
          </Field>
          <Field label="Relationship to player" error={errors.guardianRelationship?.message}>
            {(a11y) => <Input {...a11y} placeholder="Mother, father, aunt…" {...register("guardianRelationship")} />}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone number"
            required
            error={errors.guardianPhone?.message}
            hint="Nigerian mobile, e.g. 0801 234 5678"
          >
            {(a11y) => <Input {...a11y} type="tel" autoComplete="tel" {...register("guardianPhone")} />}
          </Field>
          <Field label="Alternative phone" error={errors.guardianAltPhone?.message}>
            {(a11y) => <Input {...a11y} type="tel" {...register("guardianAltPhone")} />}
          </Field>
        </div>
        <Field
          label="Email"
          required
          error={errors.guardianEmail?.message}
          hint="Your confirmation and member code arrive here"
        >
          {(a11y) => <Input {...a11y} type="email" autoComplete="email" {...register("guardianEmail")} />}
        </Field>
        <Field label="Home address" required error={errors.address?.message}>
          {(a11y) => <Textarea {...a11y} rows={2} autoComplete="street-address" {...register("address")} />}
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-display text-step-1">
          Emergency contact{" "}
          <span className="text-step--1 font-normal text-kit-soft">(if different from you)</span>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact name" error={errors.emergencyContactName?.message}>
            {(a11y) => <Input {...a11y} {...register("emergencyContactName")} />}
          </Field>
          <Field label="Contact phone" error={errors.emergencyContactPhone?.message}>
            {(a11y) => <Input {...a11y} type="tel" {...register("emergencyContactPhone")} />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-display text-step-1">Consent</legend>
        <ConsentCheckbox
          id="consentMedical"
          error={errors.consentMedical?.message}
          registration={register("consentMedical")}
          label="In an emergency, Moyours may seek medical attention for my child if I cannot be reached."
        />
        <ConsentCheckbox
          id="consentMedia"
          error={errors.consentMedia?.message}
          registration={register("consentMedia")}
          label="Photos and video from training and matches may include my child and be used on the academy's website and social media."
        />
        <ConsentCheckbox
          id="consentTerms"
          error={errors.consentTerms?.message}
          registration={register("consentTerms")}
          label="I accept the academy's terms: fees are non-refundable once training begins, and I'll keep my child's monthly subscription current."
        />
      </fieldset>

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back to welcome
        </Button>
        <Button type="submit" size="lg" loading={isSubmitting}>
          Continue to payment
        </Button>
      </div>
    </form>
  );
}

function ConsentCheckbox({
  id,
  label,
  error,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<RegistrationFormInput>>["register"]>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-[#0B3D2C]"
          {...registration}
        />
        <span className="text-step--1 leading-relaxed">{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="ml-8 text-step--1 font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
