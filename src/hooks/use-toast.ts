"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3 // Increased limit
const TOAST_REMOVE_DELAY = 10000 // Adjusted delay

// Add variant type to ToasterToast
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info' // Added variants
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, duration?: number) => { // Added optional duration
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
    toastTimeouts.delete(toastId);
  }

  const delay = duration ?? TOAST_REMOVE_DELAY; // Use provided duration or default

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, delay) // Use the calculated delay

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
       const newToasts = [action.toast, ...state.toasts];
       if (newToasts.length > TOAST_LIMIT) {
         const toastsToRemove = newToasts.slice(TOAST_LIMIT);
         toastsToRemove.forEach(t => {
           if (toastTimeouts.has(t.id)) {
             clearTimeout(toastTimeouts.get(t.id));
             toastTimeouts.delete(t.id);
           }
         });
       }
      return {
        ...state,
        toasts: newToasts.slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      if (action.toast.id) {
        // Use existing duration if available, otherwise default
         const existingToast = state.toasts.find(t => t.id === action.toast.id);
         addToRemoveQueue(action.toast.id, action.toast.duration ?? existingToast?.duration);
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
         // Find the toast to get its duration for removal queue
         const toastToDismiss = state.toasts.find(t => t.id === toastId);
         addToRemoveQueue(toastId, toastToDismiss?.duration);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.duration) // Use individual durations
        })
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        toastTimeouts.forEach(timeout => clearTimeout(timeout));
        toastTimeouts.clear();
        return {
          ...state,
          toasts: [],
        }
      }
       if (toastTimeouts.has(action.toastId)) {
         clearTimeout(toastTimeouts.get(action.toastId));
         toastTimeouts.delete(action.toastId);
       }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Update Toast type to include optional variant and duration
type Toast = Omit<ToasterToast, "id"> & {
  duration?: number; // Add duration option
};


function toast({ duration, ...props }: Toast) { // Destructure duration
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      duration: duration, // Store duration in the toast state
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Start dismiss timer using the provided or default duration
  addToRemoveQueue(id, duration);

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
