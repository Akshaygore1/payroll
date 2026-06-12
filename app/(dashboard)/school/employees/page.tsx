"use client";

import {
  Add01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Delete02Icon,
  Edit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSchoolEmployeeMutation,
  deleteSchoolEmployeeMutation,
  listSchoolEmployeesQuery,
  updateSchoolEmployeeMutation,
  type SchoolEmployeeRecord,
  type SchoolEmployeeValues,
} from "@/lib/schools/api";

const pageSize = 10;

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

function toEmployeeValues(employee: SchoolEmployeeRecord): SchoolEmployeeValues {
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

function matchesSearch(employee: SchoolEmployeeRecord, search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    employee.fullName,
    employee.designation,
    employee.panNumber,
    employee.gpfNumber,
    employee.pfNumber,
    employee.npsAccountNumber,
    employee.whatsappNumber,
    employee.contactNumber,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

export default function SchoolEmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingEmployee, setEditingEmployee] =
    useState<SchoolEmployeeRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] =
    useState<SchoolEmployeeRecord | null>(null);

  const { data, error, isPending } = useQuery({
    queryKey: ["school", "employees"],
    queryFn: listSchoolEmployeesQuery,
  });
  const employees = useMemo(() => data?.employees ?? [], [data?.employees]);

  const invalidateEmployees = async () => {
    await queryClient.invalidateQueries({ queryKey: ["school", "employees"] });
  };

  const createMutation = useMutation({
    mutationFn: createSchoolEmployeeMutation,
    onSuccess: async () => {
      setIsFormOpen(false);
      await invalidateEmployees();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: SchoolEmployeeValues) => {
      if (!editingEmployee) {
        throw new Error("No employee selected.");
      }

      return updateSchoolEmployeeMutation(editingEmployee.id, values);
    },
    onSuccess: async () => {
      setEditingEmployee(null);
      setIsFormOpen(false);
      await invalidateEmployees();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchoolEmployeeMutation(id),
    onSuccess: async () => {
      setDeletingEmployee(null);
      await invalidateEmployees();
    },
  });

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => matchesSearch(employee, search)),
    [employees, search],
  );
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function openCreateForm() {
    setEditingEmployee(null);
    setIsFormOpen(true);
  }

  function openEditForm(employee: SchoolEmployeeRecord) {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  }

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
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              Add Employee
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="sr-only">Search employees</span>
              <HugeiconsIcon
                icon={Search01Icon}
                className="shrink-0 text-muted-foreground"
              />
              <Input
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search employees"
                value={search}
              />
            </label>
            <div className="text-sm text-muted-foreground">
              {filteredEmployees.length} employee
              {filteredEmployees.length === 1 ? "" : "s"}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>PAN Number</TableHead>
                <TableHead>GPF Number</TableHead>
                <TableHead>PF Number</TableHead>
                <TableHead>NPS Account Number</TableHead>
                <TableHead>WhatsApp Number</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <>
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-10" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-10" />
                    </TableCell>
                  </TableRow>
                </>
              ) : null}
              {error ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={9}>
                    {error.message}
                  </TableCell>
                </TableRow>
              ) : null}
              {!isPending && !error && visibleEmployees.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={9}>
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : null}
              {visibleEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.fullName}</TableCell>
                  <TableCell>{employee.designation}</TableCell>
                  <TableCell>{employee.panNumber}</TableCell>
                  <TableCell>{employee.gpfNumber}</TableCell>
                  <TableCell>{employee.pfNumber}</TableCell>
                  <TableCell>{employee.npsAccountNumber}</TableCell>
                  <TableCell>{employee.whatsappNumber}</TableCell>
                  <TableCell>{employee.contactNumber}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label={`Edit ${employee.fullName}`}
                        onClick={() => openEditForm(employee)}
                        size="icon-xs"
                        type="button"
                        variant="outline"
                      >
                        <HugeiconsIcon icon={Edit02Icon} />
                      </Button>
                      <Button
                        aria-label={`Delete ${employee.fullName}`}
                        onClick={() => setDeletingEmployee(employee)}
                        size="icon-xs"
                        type="button"
                        variant="destructive"
                      >
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {pageCount}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
                variant="outline"
              >
                <HugeiconsIcon icon={ChevronLeftIcon} data-icon="inline-start" />
                Previous
              </Button>
              <Button
                disabled={currentPage >= pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
                type="button"
                variant="outline"
              >
                Next
                <HugeiconsIcon icon={ChevronRightIcon} data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
            <DialogDescription>
              All employee details are required before saving.
            </DialogDescription>
          </DialogHeader>
          <SchoolEmployeeForm
            defaultValues={
              editingEmployee ? toEmployeeValues(editingEmployee) : emptyEmployeeValues
            }
            onCancel={() => setIsFormOpen(false)}
            onSubmit={
              editingEmployee
                ? updateMutation.mutateAsync
                : createMutation.mutateAsync
            }
            pendingLabel={editingEmployee ? "Saving" : "Creating"}
            submitLabel={editingEmployee ? "Save Changes" : "Create Employee"}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingEmployee}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEmployee(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              {deletingEmployee?.fullName ?? "this employee"}.
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

                if (deletingEmployee) {
                  deleteMutation.mutate(deletingEmployee.id);
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
