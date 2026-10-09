// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DifficultyPicker } from "../../src/components/DifficultyPicker";

describe("difficulty picker keyboard controls", () => {
	it("keeps the slider keyboard reachable and confirms the selected level", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const { rerender } = render(
			<DifficultyPicker level={2} locale="en" onChange={onChange} />,
		);
		const slider = screen.getByRole("slider", { name: /Pick a level/i });
		await user.tab();
		expect(document.activeElement).toBe(slider);
		fireEvent.change(slider, { target: { value: "3" } });
		expect(slider.getAttribute("aria-valuetext")).toContain("3");
		const startButton = screen.getByRole("button", { name: /play level 3/i });
		startButton.focus();
		await user.keyboard("{Enter}");
		expect(onChange).toHaveBeenCalledWith(3);
	});
});
