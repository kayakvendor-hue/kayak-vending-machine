import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

describe('Navbar', () => {
    test('renders Navbar component', () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );
        const linkElement = screen.getByText(/home/i);
        expect(linkElement).toBeInTheDocument();
    });
});