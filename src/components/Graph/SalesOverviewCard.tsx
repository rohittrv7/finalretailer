import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Grid,
} from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { salesData } from "@/data/data";

export default function SalesOverviewCard() {
  return (
    <Grid xs={12} md={8} size={8}>
      <Card
        sx={{
          bgcolor: "hsl(var(--card))",
          borderRadius: 1,
          boxShadow: "var(--shadow-md)",
          height: "100%",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
            >
              Sales Overview
            </Typography>
            <IconButton size="small">
              <FileDownload />
            </IconButton>
          </Box>

          {/* Line Chart */}
          <LineChart
            xAxis={[{ dataKey: "month", scaleType: "band" }]}
            series={[
              { dataKey: "sales", label: "Sales", color: "#1976d2" },
              { dataKey: "profit", label: "Profit", color: "#9c27b0" },
            ]}
            dataset={salesData}
            height={300}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            grid={{ horizontal: true }}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}
