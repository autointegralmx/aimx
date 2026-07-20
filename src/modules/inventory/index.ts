export {
  vehicleCategorySchema,
  vehicleStatusSchema,
  vehicleDraftSchema,
  vehicleWriteObjectSchema,
  vehicleWriteSchema,
  vehicleUpdateSchema,
  DAMAGE_TAGS,
  PUBLIC_TAGS,
} from "@/modules/inventory/domain/vehicle-schema";
export type {
  VehicleCategory,
  VehicleStatus,
  VehicleDraftInput,
  VehicleWriteInput,
  VehicleUpdateInput,
} from "@/modules/inventory/domain/vehicle-schema";

export {
  normalizeVehiclePublicationFlags,
  assertCanPublish,
  isActiveOpportunity,
  vehicleStatusLabel,
  canTransitionVehicleStatus,
} from "@/modules/inventory/domain/vehicle-status";

export {
  parseAdminVehicleListParams,
  hasActiveAdminVehicleFilters,
  buildAdminVehiclesHref,
  ADMIN_VEHICLES_PAGE_SIZE,
} from "@/modules/inventory/domain/admin-list-filters";
export type { AdminVehicleListFilters } from "@/modules/inventory/domain/admin-list-filters";

export {
  getValidAdminVehicleActions,
  adminVehicleActionLabel,
  requiresAdminActionConfirmation,
  adminActionConfirmationCopy,
} from "@/modules/inventory/domain/admin-vehicle-actions";
export type { AdminVehicleAction } from "@/modules/inventory/domain/admin-vehicle-actions";

export {
  createVehicleRepository,
  ADMIN_VEHICLE_LIST_COLUMNS,
  PUBLIC_VEHICLE_COLUMNS,
} from "@/modules/inventory/infrastructure/vehicle-repository";
export type {
  VehicleRepository,
  AdminVehicleListItem,
  PublicVehicle,
  ListAdminVehiclesResult,
} from "@/modules/inventory/infrastructure/vehicle-repository";

export {
  listAdminVehiclesUseCase,
  getAdminVehicleByIdUseCase,
  createVehicleDraftUseCase,
  updateVehicleUseCase,
  publishVehicleUseCase,
  unpublishVehicleUseCase,
  reserveVehicleUseCase,
  makeVehicleAvailableUseCase,
  markVehicleSoldUseCase,
  archiveVehicleUseCase,
  duplicateVehicleUseCase,
  assertStaffCanManageVehicles,
} from "@/modules/inventory/application/vehicle-use-cases";
