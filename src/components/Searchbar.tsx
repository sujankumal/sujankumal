'use client';

import { Search } from "@mui/icons-material";
import {
  IconButton,
  InputBase,
  Paper,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const Searchbar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Initialize searchTerm from URL if present
  useEffect(() => {
    const query = searchParams.get("query");
    if (query) {
      setSearchTerm(query);
      setDebouncedSearchTerm(query);
    } else {
      setSearchTerm("");
      setDebouncedSearchTerm("");
    }
  }, [searchParams]);

  // Debounce the input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync debounced search term to the URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentQuery = params.get("query") || "";

    if (debouncedSearchTerm !== currentQuery) {
      if (debouncedSearchTerm) {
        params.set("query", debouncedSearchTerm);
      } else {
        params.delete("query");
      }
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearchTerm, pathname, replace]);

  return (
    <Paper
      component="form"
      elevation={3}
      className="flex justify-center px-1 py-1 "
      onSubmit={(e) => e.preventDefault()}
    >
      <InputBase
        className="ml-1 flex-1"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <IconButton type="submit" className="bg-orange-600 text-white">
        <Search />
      </IconButton>
    </Paper>
  );
};

export default Searchbar;