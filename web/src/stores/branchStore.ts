import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '@/services/branches.service';

interface BranchState {
  branches: Branch[];
  selectedBranch: Branch | null;
  setBranches: (branches: Branch[]) => void;
  selectBranch: (branchId: string) => void;
  clearBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranch: null,
      setBranches: (branches) => set({ branches }),
      selectBranch: (branchId) => {
        const branch = get().branches.find((b) => b.id === branchId) || null;
        set({ selectedBranch: branch });
      },
      clearBranch: () => set({ selectedBranch: null }),
    }),
    {
      name: 'branch-storage',
    },
  ),
);

