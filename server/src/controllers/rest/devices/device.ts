import { parse } from 'url';
import { API, SsmAnsible, SsmStatus } from 'ssm-shared-lib';
import { setToCache } from '../../../data/cache';
import Device from '../../../data/database/model/Device';
import DeviceAuth from '../../../data/database/model/DeviceAuth';
import DeviceAuthRepo from '../../../data/database/repository/DeviceAuthRepo';
import DeviceRepo from '../../../data/database/repository/DeviceRepo';
import { filterByFields, filterByQueryParams } from '../../../helpers/query/FilterHelper';
import { paginate } from '../../../helpers/query/PaginationHelper';
import { sortByFields } from '../../../helpers/query/SorterHelper';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../middlewares/api/ApiError';
import { SuccessResponse } from '../../../middlewares/api/ApiResponse';
import asyncHandler from '../../../middlewares/AsyncHandler';
import { DEFAULT_VAULT_ID, vaultEncrypt } from '../../../modules/ansible-vault/ansible-vault';
import WatcherEngine from '../../../modules/docker/core/WatcherEngine';
import Shell from '../../../modules/shell';
import DeviceUseCases from '../../../services/DeviceUseCases';

export const addDevice = asyncHandler(async (req, res) => {
  const {
    masterNodeUrl,
    ip,
    authType,
    sshKey,
    sshUser,
    sshPwd,
    sshPort,
    unManaged,
    becomeMethod,
    becomePass,
    sshKeyPass,
  } = req.body;
  if (masterNodeUrl) {
    await setToCache(SsmAnsible.DefaultSharedExtraVarsList.MASTER_NODE_URL, masterNodeUrl);
  }
  try {
    const isUnManagedDevice = unManaged === true;
    const createdDevice = await DeviceRepo.create({
      ip: ip,
      status: isUnManagedDevice
        ? SsmStatus.DeviceStatus.UNMANAGED
        : SsmStatus.DeviceStatus.REGISTERING,
    } as Device);
    await DeviceAuthRepo.updateOrCreateIfNotExist({
      device: createdDevice,
      authType: authType,
      sshUser: sshUser,
      sshPwd: sshPwd ? await vaultEncrypt(sshPwd, DEFAULT_VAULT_ID) : undefined,
      sshPort: sshPort,
      sshKey: sshKey ? await vaultEncrypt(sshKey, DEFAULT_VAULT_ID) : undefined,
      sshKeyPass: sshKeyPass ? await vaultEncrypt(sshKeyPass, DEFAULT_VAULT_ID) : undefined,
      becomeMethod: becomeMethod,
      becomePass: becomePass ? await vaultEncrypt(becomePass, DEFAULT_VAULT_ID) : undefined,
    } as DeviceAuth);
    if (sshKey) {
      await Shell.SshPrivateKeyFileManager.saveSshKey(sshKey, createdDevice.uuid);
    }
    void WatcherEngine.registerWatcher(createdDevice);
    new SuccessResponse('Add device successful', { device: createdDevice as API.DeviceItem }).send(
      res,
    );
  } catch (error: any) {
    throw new BadRequestError(`The ip likely already exists ${error.message}`);
  }
});

export const addDeviceAuto = asyncHandler(async (req, res) => {
  const { ip } = req.body;

  const device = await DeviceRepo.findOneByIp(ip);

  if (device) {
    throw new ForbiddenError(
      'The ip already exists, please delete or change your devices before registering this device',
    );
  }

  const createdDevice = await DeviceRepo.create({
    ip: ip,
  } as Device);
  new SuccessResponse('Add device auto successful', { id: createdDevice.uuid }).send(res);
});

export const getDevices = asyncHandler(async (req, res) => {
  const realUrl = req.url;
  const { current = 1, pageSize = 10 } = req.query;
  const params = parse(realUrl, true).query as unknown as API.PageParams &
    API.DeviceItem & {
      sorter: any;
      filter: any;
    };
  const devices = await DeviceRepo.findAll();
  if (!devices) {
    return new SuccessResponse('Get Devices successful', []).send(res);
  }

  // Use the separated services
  let dataSource = sortByFields(devices, params);
  dataSource = filterByFields(dataSource, params);
  //TODO: update validator
  dataSource = filterByQueryParams(dataSource, params, ['ip', 'uuid', 'status', 'hostname']);
  const totalBeforePaginate = dataSource?.length || 0;
  // Add pagination
  dataSource = paginate(dataSource, current as number, pageSize as number);

  new SuccessResponse('Get Devices successful', dataSource, {
    total: totalBeforePaginate,
    success: true,
    pageSize,
    current: parseInt(`${params.current}`, 10) || 1,
  }).send(res);
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const device = await DeviceRepo.findOneByUuid(uuid);

  if (!device) {
    throw new NotFoundError(`Device not found (${req.params.uuid})`);
  }
  await DeviceUseCases.deleteDevice(device);
  new SuccessResponse('Delete device successful').send(res);
});

//TODO validation
export const updateDockerWatcher = asyncHandler(async (req, res) => {
  const {
    dockerWatcher,
    dockerWatcherCron,
    dockerStatsWatcher,
    dockerStatsCron,
    dockerEventsWatcher,
  } = req.body;
  const device = await DeviceRepo.findOneByUuid(req.params.uuid);

  if (!device) {
    throw new NotFoundError(`Device not found (${req.params.uuid})`);
  }
  await DeviceUseCases.updateDockerWatcher(
    device,
    dockerWatcher,
    dockerWatcherCron,
    dockerStatsWatcher,
    dockerStatsCron,
    dockerEventsWatcher,
  );
  new SuccessResponse('Update docker watcher flag successful', {
    dockerWatcher: dockerWatcher,
    dockerWatcherCron: dockerWatcherCron,
    dockerStatsWatcher: dockerStatsWatcher,
    dockerEventsWatcher: dockerEventsWatcher,
    dockerStatsCron: dockerStatsCron,
  }).send(res);
});
