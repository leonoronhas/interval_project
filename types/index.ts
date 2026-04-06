export type Violation = {
  field: string;
  expected: string;
  found: string;
};

export type GenerateRequest = {
  customerId: string;
  type: "email" | "sms" | "call_script";
  mode: "guarded" | "unguarded";
};
