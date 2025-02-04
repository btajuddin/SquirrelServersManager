import { request } from '@umijs/max';
import { API, SsmAnsible } from 'ssm-shared-lib';

export async function getPlaybooks(
  options?: Record<string, any>,
): Promise<API.Response<API.PlaybookFile[]>> {
  return request<API.Response<API.PlaybookFile[]>>(`/api/playbooks/`, {
    method: 'GET',
    ...(options || {}),
  });
}

export async function readPlaybookContent(playbookUuid: string) {
  return request<API.PlaybookContent>(`/api/playbooks/${playbookUuid}`, {
    method: 'GET',
    ...{},
  });
}

export async function patchPlaybook(playbookUuid: string, content: string) {
  return request<API.PlaybookOpResponse>(`/api/playbooks/${playbookUuid}/`, {
    method: 'PATCH',
    data: { content: content },
    ...{},
  });
}

export async function executePlaybook(
  playbook: string,
  target: string[] | undefined,
  extraVars?: API.ExtraVars,
  mode: SsmAnsible.ExecutionMode = SsmAnsible.ExecutionMode.APPLY,
  options?: Record<string, any>,
) {
  return request<API.Exec>(`/api/playbooks/exec/${playbook}`, {
    method: 'POST',
    data: {
      playbook: playbook,
      target: target,
      extraVars: extraVars,
      mode: mode,
    },
    ...(options || {}),
  });
}

export async function executePlaybookByQuickRef(
  quickRef: string,
  target: string[] | undefined,
  extraVars?: API.ExtraVars,
  mode: SsmAnsible.ExecutionMode = SsmAnsible.ExecutionMode.APPLY,
  options?: Record<string, any>,
) {
  return request<API.Exec>(`/api/playbooks/exec/quick-ref/${quickRef}`, {
    method: 'POST',
    data: {
      quickRef: quickRef,
      target: target,
      extraVars: extraVars,
      mode: mode,
    },
    ...(options || {}),
  });
}

export async function getExecLogs(execId: string) {
  return request<API.Response<API.ExecLogs>>(
    `/api/playbooks/exec/${execId}/logs/`,
    {
      method: 'GET',
      ...{},
    },
  );
}

export async function getTaskStatuses(execId: string) {
  return request<API.Response<API.ExecStatuses>>(
    `/api/playbooks/exec/${execId}/status/`,
    {
      method: 'GET',
      ...{},
    },
  );
}

export async function deletePlaybook(playbookUuid: string) {
  return request<API.PlaybookOpResponse>(`/api/playbooks/${playbookUuid}/`, {
    method: 'DELETE',
    ...{},
  });
}

export async function postPlaybookExtraVar(
  playbookUuid: string,
  extraVar: API.ExtraVar,
) {
  return request<API.PlaybookOpResponse>(
    `/api/playbooks/${playbookUuid}/extravars`,
    {
      data: { extraVar: extraVar },
      method: 'POST',
      ...{},
    },
  );
}

export async function deletePlaybookExtraVar(
  playbookUuid: string,
  extraVar: string,
) {
  return request<API.PlaybookOpResponse>(
    `/api/playbooks/${playbookUuid}/extravars/${extraVar}`,
    {
      method: 'DELETE',
      ...{},
    },
  );
}

export async function postExtraVarSharedValue(
  data: { extraVar: string; value: string },
  params?: any,
  options?: Record<string, any>,
) {
  return request<API.PlaybookOpResponse>(
    `/api/playbooks/extravars/${data.extraVar}`,
    {
      data: { value: data.value },
      method: 'POST',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

export async function getCollections(
  params?: any,
  options?: Record<string, any>,
) {
  return request<any>('/api/playbooks/galaxy/collection', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getCollection(
  params: { name: string; namespace: string; version: string },
  options?: Record<string, any>,
) {
  return request<any>('/api/playbooks/galaxy/collection/details', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function postInstallCollection(
  body: { name: string; namespace: string },
  params?: any,
  options?: Record<string, any>,
) {
  return request<any>('/api/playbooks/galaxy/collection/install', {
    method: 'POST',
    data: body,
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
