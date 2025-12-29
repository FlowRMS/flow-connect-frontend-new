"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import menuItems from "./menu-item";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Sidebar({
  isMobileOpen = false,
  isDesktopCollapsed = false,
  onToggle,
}) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const defaults = {};
    for (const item of menuItems) {
      if (item.type === "group") {
        defaults[item.id] = true;
      }
    }
    return defaults;
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderMenuItem = (item) => {
    if (item.type === "group") {
      const isExpanded = Boolean(expandedGroups[item.id]);
      const hasActiveChild = item.children?.some(child => pathname === child.href);
      
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleGroup(item.id)}
            className={`w-full flex items-center rounded-md text-sm font-medium transition-colors ${
              isDesktopCollapsed
                ? "justify-center px-2 py-3"
                : "gap-3 px-2 py-2"
            } ${
              hasActiveChild
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <div className="flex-shrink-0 w-5 h-5">
              <item.Icon className="h-5 w-5" />
            </div>
            <span
              className={`flex-1 min-w-0 truncate text-left transition-all duration-300 ${
                isDesktopCollapsed ? " md:hidden" : "block"
              }`}
            >
              {item.name}
            </span>
            {!isDesktopCollapsed && (
              <div className="flex-shrink-0 w-4 h-4">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          
          {isExpanded && !isDesktopCollapsed && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children?.map((child) => {
                const isActive = pathname === child.href;
                return (
                  <Link
                    key={child.id}
                    href={child.href}
                    className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => {
                      // Close mobile sidebar when clicking a link
                      if (window.innerWidth < 768) {
                        onToggle?.();
                      }
                    }}
                  >
                    <div className="flex-shrink-0 w-4 h-4">
                      <child.Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 min-w-0 truncate">
                      {child.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Regular link item
      const isActive = pathname === item.href;
      return (
        <Link
          key={item.id}
          href={item.href}
          title={isDesktopCollapsed ? item.name : undefined}
          className={`flex items-center rounded-md text-sm font-medium transition-colors ${
            isDesktopCollapsed
              ? "justify-center px-2 py-3"
              : "gap-3 px-2 py-2"
          } ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
          onClick={() => {
            // Close mobile sidebar when clicking a link
            if (window.innerWidth < 768) {
              onToggle?.();
            }
          }}
        >
          <div className="flex-shrink-0 w-5 h-5">
            <item.Icon className="h-5 w-5" />
          </div>
          <span
            className={`flex-1 min-w-0 truncate transition-all duration-300 ${
              isDesktopCollapsed ? " md:hidden" : "block"
            }`}
          >
            {item.name}
          </span>
        </Link>
      );
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative z-50 md:z-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
        ${isDesktopCollapsed ? "md:w-16" : "md:w-64"} w-64
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="border-b border-gray-200 py-4">
          <Link
            href="/"
            className={`flex items-center hover:opacity-80 transition-opacity ${
              isDesktopCollapsed ? "justify-center px-2" : "gap-2 px-3"
            }`}
          >
            <Image
              src="/flow-logo.png"
              alt="Flow Analytics"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            <span
              className={`text-sm md:text-lg font-medium text-gray-900 transition-all duration-300 ${
                isDesktopCollapsed ? " md:hidden" : "block"
              }`}
            >
              FlowAnalytics
            </span>
          </Link>
        </div>

        {/* Menu Items */}
        <div
          className={`flex-1 py-4 flex flex-col ${
            isDesktopCollapsed ? "px-2" : "px-3"
          }`}
        >
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>
        </div>
      </div>
    </>
  );
}
