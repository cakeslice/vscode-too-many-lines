export const objectToCssString = (settings: any): string => {
   let value = "";
   const cssString = Object.keys(settings)
      .map((setting) => {
         value = settings[setting];
         if (typeof value === "string" || typeof value === "number") {
            return `${setting}: ${value};`;
         }
      })
      .join(" ");

   return cssString;
};
