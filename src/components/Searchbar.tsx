import { Search } from "@mui/icons-material";
import {
  IconButton,
  InputBase,
  InputBaseProps,
  Paper,
} from "@mui/material";
import { useState } from "react";

type Props = {
  // the outside components only needs to know if the searchbar form has been submitted
  onSubmit(searchTerm: string): void;
  // add inputProps so that we can listen to onFocus / onBlur events if needed
  inputProps: InputBaseProps;
};
const Searchbar = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Paper
      component="form"
      elevation={3}
      // sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5 }}
      className="flex justify-center px-1 py-1 "
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit((searchTerm as string) ?? "");
      }}
    >
      <InputBase
        className="ml-1 flex-1"
        placeholder="Search..."
        inputProps={{ "aria-label": "search" }}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        {...props.inputProps}
      />
      <IconButton type="submit" className="bg-teal-600 text-white">
        <Search />
      </IconButton>
    </Paper>
  );
};

export default Searchbar;