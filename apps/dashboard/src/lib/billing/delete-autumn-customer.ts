import { autumn } from "@notra/ai/billing/autumn";

export async function deleteAutumnCustomer(
  organizationId: string
): Promise<void> {
  if (!autumn) {
    return;
  }

  await autumn.customers.delete({
    customerId: organizationId,
    deleteInStripe: true,
  });
}
