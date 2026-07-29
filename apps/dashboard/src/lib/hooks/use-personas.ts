"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePersonaInput,
  CreatePersonaReferenceInput,
  Persona,
  PersonaReference,
  PersonaSocialInput,
  UpdatePersonaInput,
  UpdatePersonaReferenceInput,
} from "@/types/personas";
import { dashboardOrpc } from "../orpc/query";

export function usePersonas(organizationId: string) {
  return useQuery<{ personas: Persona[] }>(
    dashboardOrpc.personas.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );
}

export function usePersona(organizationId: string, personaId: string) {
  return useQuery<Persona>(
    dashboardOrpc.personas.get.queryOptions({
      input: { organizationId, personaId },
      enabled: !!organizationId && !!personaId,
    })
  );
}

function usePersonaInvalidation(organizationId: string) {
  const queryClient = useQueryClient();

  return (personaId?: string) => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.personas.list.queryKey({
        input: { organizationId },
      }),
    });
    if (personaId) {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.personas.get.queryKey({
          input: { organizationId, personaId },
        }),
      });
    }
  };
}

export function useCreatePersona(organizationId: string) {
  const invalidate = usePersonaInvalidation(organizationId);

  return useMutation({
    mutationFn: (payload: CreatePersonaInput) =>
      dashboardOrpc.personas.create.call({ organizationId, payload }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePersona(organizationId: string) {
  const invalidate = usePersonaInvalidation(organizationId);

  return useMutation({
    mutationFn: ({
      personaId,
      payload,
    }: {
      personaId: string;
      payload: UpdatePersonaInput;
    }) =>
      dashboardOrpc.personas.update.call({
        organizationId,
        personaId,
        payload,
      }),
    onSuccess: (_data, variables) => invalidate(variables.personaId),
  });
}

export function useDeletePersona(organizationId: string) {
  const invalidate = usePersonaInvalidation(organizationId);

  return useMutation({
    mutationFn: (personaId: string) =>
      dashboardOrpc.personas.delete.call({ organizationId, personaId }),
    onSuccess: () => invalidate(),
  });
}

export function useSetPersonaSocials(organizationId: string) {
  const invalidate = usePersonaInvalidation(organizationId);

  return useMutation({
    mutationFn: ({
      personaId,
      socials,
    }: {
      personaId: string;
      socials: PersonaSocialInput[];
    }) =>
      dashboardOrpc.personas.setSocials.call({
        organizationId,
        personaId,
        socials,
      }),
    onSuccess: (_data, variables) => invalidate(variables.personaId),
  });
}

export function usePersonaReferences(
  organizationId: string,
  personaId: string
) {
  return useQuery<{ references: PersonaReference[] }>(
    dashboardOrpc.personas.references.list.queryOptions({
      input: { organizationId, personaId },
      enabled: !!organizationId && !!personaId,
    })
  );
}

function usePersonaReferenceInvalidation(
  organizationId: string,
  personaId: string
) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.personas.references.list.queryKey({
        input: { organizationId, personaId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.personas.list.queryKey({
        input: { organizationId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.personas.get.queryKey({
        input: { organizationId, personaId },
      }),
    });
  };
}

export function useCreatePersonaReference(
  organizationId: string,
  personaId: string
) {
  const invalidate = usePersonaReferenceInvalidation(organizationId, personaId);

  return useMutation({
    mutationFn: (payload: CreatePersonaReferenceInput) =>
      dashboardOrpc.personas.references.create.call({
        organizationId,
        personaId,
        payload,
      }),
    onSuccess: invalidate,
  });
}

export function useUpdatePersonaReference(
  organizationId: string,
  personaId: string
) {
  const invalidate = usePersonaReferenceInvalidation(organizationId, personaId);

  return useMutation({
    mutationFn: ({
      referenceId,
      payload,
    }: {
      referenceId: string;
      payload: UpdatePersonaReferenceInput;
    }) =>
      dashboardOrpc.personas.references.update.call({
        organizationId,
        personaId,
        referenceId,
        payload,
      }),
    onSuccess: invalidate,
  });
}

export function useDeletePersonaReference(
  organizationId: string,
  personaId: string
) {
  const invalidate = usePersonaReferenceInvalidation(organizationId, personaId);

  return useMutation({
    mutationFn: (referenceId: string) =>
      dashboardOrpc.personas.references.delete.call({
        organizationId,
        personaId,
        referenceId,
      }),
    onSuccess: invalidate,
  });
}
