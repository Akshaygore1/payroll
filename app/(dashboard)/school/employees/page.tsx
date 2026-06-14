"use client";

import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReducer } from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";

import { SchoolEmployeeForm } from "@/components/schools/school-employee-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSchoolEmployeeMutation,
  deleteSchoolEmployeeMutation,
  listSchoolEmployeesQuery,
  updateSchoolEmployeeMutation,
  type SchoolEmployeeRecord,
  type SchoolEmployeeValues,
} from "@/lib/schools/api";

const emptyEmployeeValues: SchoolEmployeeValues = {
  fullName: "",
  designation: "",
  panNumber: "",
  gpfNumber: "",
  pfNumber: "",
  npsAccountNumber: "",
  whatsappNumber: "",
  contactNumber: "",
};

type EmployeesState = {
  sorting: SortingState;
  searchValue: string;
  pagination: PaginationState;
  editingEmployee: SchoolEmployeeRecord | null;
  isFormOpen: boolean;
  deletingEmployee: SchoolEmployeeRecord | null;
};

type EmployeesAction =
  | { type: "sortingChanged"; sorting: SortingState }
  | { type: "searchChanged"; searchValue: string }
  | { type: "paginationChanged"; pagination: PaginationState }
  | { type: "createStarted" }
  | { type: "editStarted"; employee: SchoolEmployeeRecord }
  | { type: "formOpenChanged"; open: boolean }
  | { type: "deleteStarted"; employee: SchoolEmployeeRecord }
  | { type: "deleteCleared" }
  | { type: "createFinished" }
  | { type: "updateFinished" }
  | { type: "deleteFinished" };

const initialEmployeesState: EmployeesState = {
  sorting: [],
  searchValue: "",
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  editingEmployee: null,
  isFormOpen: false,
  deletingEmployee: null,
};

function employeesReducer(
  state: EmployeesState,
  action: EmployeesAction,
): EmployeesState {
  switch (action.type) {
    case "sortingChanged":
      return {
        ...state,
        sorting: action.sorting,
      };
    case "searchChanged":
      return {
        ...state,
        searchValue: action.searchValue,
        pagination: {
          ...state.pagination,
          pageIndex: 0,
        },
      };
    case "paginationChanged":
      return {
        ...state,
        pagination: action.pagination,
      };
    case "createStarted":
      return {
        ...state,
        editingEmployee: null,
        isFormOpen: true,
      };
    case "editStarted":
      return {
        ...state,
        editingEmployee: action.employee,
        isFormOpen: true,
      };
    case "formOpenChanged":
      return {
        ...state,
        isFormOpen: action.open,
        editingEmployee: action.open ? state.editingEmployee : null,
      };
    case "deleteStarted":
      return {
        ...state,
        deletingEmployee: action.employee,
      };
    case "deleteCleared":
    case "deleteFinished":
      return {
        ...state,
        deletingEmployee: null,
      };
    case "createFinished":
      return {
        ...state,
        isFormOpen: false,
      };
    case "updateFinished":
      return {
        ...state,
        editingEmployee: null,
        isFormOpen: false,
      };
  }
}

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  if (typeof updater === "function") {
    return (updater as (previous: T) => T)(current);
  }

  return updater;
}

function toEmployeeValues(
  employee: SchoolEmployeeRecord,
): SchoolEmployeeValues {
  return {
    fullName: employee.fullName,
    designation: employee.designation,
    panNumber: employee.panNumber,
    gpfNumber: employee.gpfNumber,
    pfNumber: employee.pfNumber,
    npsAccountNumber: employee.npsAccountNumber,
    whatsappNumber: employee.whatsappNumber,
    contactNumber: employee.contactNumber,
  };
}

export default function SchoolEmployeesPage() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(employeesReducer, initialEmployeesState);

  const { data, error, isPending } = useQuery({
    queryKey: ["school", "employees"],
    queryFn: listSchoolEmployeesQuery,
  });

  const employees = data?.employees ?? [];

  const createMutation = useMutation({
    mutationFn: createSchoolEmployeeMutation,
    onSuccess: async () => {
      dispatch({ type: "createFinished" });
      await queryClient.invalidateQueries({
        queryKey: ["school", "employees"],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: SchoolEmployeeValues) => {
      if (!state.editingEmployee) {
        throw new Error("No employee selected.");
      }

      return updateSchoolEmployeeMutation(state.editingEmployee.id, values);
    },
    onSuccess: async () => {
      dispatch({ type: "updateFinished" });
      await queryClient.invalidateQueries({
        queryKey: ["school", "employees"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchoolEmployeeMutation(id),
    onSuccess: async () => {
      dispatch({ type: "deleteFinished" });
      await queryClient.invalidateQueries({
        queryKey: ["school", "employees"],
      });
    },
  });

  function openCreateForm() {
    dispatch({ type: "createStarted" });
  }

  function openEditForm(employee: SchoolEmployeeRecord) {
    dispatch({ type: "editStarted", employee });
  }

  const columns: Array<ColumnDef<SchoolEmployeeRecord>> = [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => row.original.fullName,
      meta: {
        cellClassName: "font-medium",
      },
    },
    {
      accessorKey: "designation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designation" />
      ),
    },
    {
      accessorKey: "panNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="PAN Number" />
      ),
    },
    {
      accessorKey: "contactNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Number" />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            aria-label={`Edit ${row.original.fullName}`}
            onClick={() => openEditForm(row.original)}
            size="icon-xs"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={Edit02Icon} />
          </Button>
          <Button
            aria-label={`Delete ${row.original.fullName}`}
            onClick={() =>
              dispatch({ type: "deleteStarted", employee: row.original })
            }
            size="icon-xs"
            type="button"
            variant="destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      ),
      enableGlobalFilter: false,
      enableSorting: false,
      meta: {
        cellClassName: "text-right",
        headerClassName: "text-right",
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage school employee identity, fund, and contact details.
          </CardDescription>
          <CardAction>
            <Button onClick={openCreateForm} size="sm">
              <HugeiconsIcon data-icon="inline-start" icon={Add01Icon} />
              Add Employee
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employees}
            emptyMessage="No employees found."
            errorMessage={error?.message}
            isLoading={isPending}
            onPaginationChange={(pagination) =>
              dispatch({
                type: "paginationChanged",
                pagination: resolveUpdater(pagination, state.pagination),
              })
            }
            onSearchValueChange={(searchValue) =>
              dispatch({ type: "searchChanged", searchValue })
            }
            onSortingChange={(sorting) =>
              dispatch({
                type: "sortingChanged",
                sorting: resolveUpdater(sorting, state.sorting),
              })
            }
            pagination={state.pagination}
            renderToolbarEnd={EmployeeCount}
            searchPlaceholder="Search employees"
            searchValue={state.searchValue}
            sorting={state.sorting}
          />
        </CardContent>
      </Card>

      <Dialog
        open={state.isFormOpen}
        onOpenChange={(open) => dispatch({ type: "formOpenChanged", open })}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {state.editingEmployee ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
            <DialogDescription>
              All employee details are required before saving.
            </DialogDescription>
          </DialogHeader>
          <SchoolEmployeeForm
            defaultValues={
              state.editingEmployee
                ? toEmployeeValues(state.editingEmployee)
                : emptyEmployeeValues
            }
            onCancel={() => dispatch({ type: "formOpenChanged", open: false })}
            onSubmit={
              state.editingEmployee
                ? updateMutation.mutateAsync
                : createMutation.mutateAsync
            }
            pendingLabel={state.editingEmployee ? "Saving" : "Creating"}
            submitLabel={
              state.editingEmployee ? "Save Changes" : "Create Employee"
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!state.deletingEmployee}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "deleteCleared" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              {state.deletingEmployee?.fullName ?? "this employee"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();

                if (state.deletingEmployee) {
                  deleteMutation.mutate(state.deletingEmployee.id);
                }
              }}
              variant="destructive"
            >
              {deleteMutation.isPending ? "Deleting" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmployeeCount({
  table,
}: {
  table: TanStackTable<SchoolEmployeeRecord>;
}) {
  const count = table.getFilteredRowModel().rows.length;
  return (
    <div className="text-sm text-muted-foreground">
      {count} employee{count === 1 ? "" : "s"}
    </div>
  );
}
